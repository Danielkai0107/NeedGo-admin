<template>
  <div class="card">
    <!-- Panel Header -->
    <div class="card-header">
      <div class="d-flex justify-content-between align-items-center w-100">
        <h5 class="card-title mb-0">系統地點管理</h5>
        <div>
          <button class="btn btn-primary" @click="openCreateLocationModal">
            新增地點
          </button>
          <button
            class="btn btn-success ms-2"
            @click="triggerFileUpload"
            :disabled="uploading"
          >
            <span
              v-if="uploading"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            {{ uploading ? "上傳中..." : "批量上傳" }}
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".csv"
            @change="handleFileUpload"
            style="display: none"
          />
        </div>
      </div>
    </div>

    <!-- Panel Controls -->
    <div class="card-body">
      <div class="row mb-3">
        <div class="col-md-6">
          <div class="input-group">
            <span class="input-group-text">🔍</span>
            <input
              v-model="searchQuery"
              class="form-control"
              placeholder="搜尋地點名稱或分類..."
            />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="d-flex justify-content-center align-items-center py-5"
      >
        <div class="spinner-border text-primary me-3" role="status">
          <span class="visually-hidden">載入中...</span>
        </div>
        <span>載入中...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredLocations.length === 0" class="text-center py-5">
        <h5>沒有系統地點</h5>
        <p class="text-muted">點擊「新增地點」按鈕以創建第一個地點</p>
      </div>

      <!-- Table -->
      <div v-else class="table-responsive">
        <table class="table table-hover">
          <thead class="table-light">
            <tr>
              <th>名稱</th>
              <th>分類</th>
              <th>經緯度</th>
              <th width="120">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="loc in filteredLocations" :key="loc.id">
              <td>
                <strong>{{ loc.name }}</strong>
              </td>
              <td>
                <span class="badge bg-secondary">
                  {{ loc.category }}
                </span>
              </td>
              <td>
                <code class="small">
                  {{ loc.lat.toFixed(4) }}, {{ loc.lng.toFixed(4) }}
                </code>
              </td>
              <td>
                <div class="btn-group btn-group-sm" role="group">
                  <button
                    class="btn btn-outline-secondary"
                    @click="editLocation(loc)"
                    title="編輯"
                  >
                    編輯
                  </button>
                  <button
                    class="btn btn-outline-danger"
                    @click="deleteLocation(loc.id)"
                    title="刪除"
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- LocationModal -->
    <LocationModal
      v-if="showLocationModal"
      :locationData="locationForm"
      :saving="saving"
      @close="closeLocationModal"
      @save="saveLocation"
      @update:locationData="updateLocationForm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import LocationModal from "./LocationModal.vue";

const loading = ref(false);
const saving = ref(false);
const searchQuery = ref("");
const locations = ref([]);
const showLocationModal = ref(false);
const editingLocationData = ref(null);
const locationForm = ref({
  name: "",
  category: "",
  lat: 0,
  lng: 0,
  address: "",
});
const fileInput = ref(null);
const uploading = ref(false);

const filteredLocations = computed(() => {
  if (!searchQuery.value) return locations.value;
  const q = searchQuery.value.toLowerCase();
  return locations.value.filter(
    (l) =>
      l.name.toLowerCase().includes(q) || l.category.toLowerCase().includes(q)
  );
});

function openCreateLocationModal() {
  editingLocationData.value = null;
  locationForm.value = { name: "", category: "", lat: 0, lng: 0, address: "" };
  showLocationModal.value = true;
}

// 新增這個函數來處理子組件的更新
function updateLocationForm(newData) {
  console.log("父組件收到更新:", newData); // 除錯用
  locationForm.value = { ...newData };
}
function triggerFileUpload() {
  fileInput.value.click();
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.endsWith(".csv")) {
    alert("請選擇 CSV 檔案");
    return;
  }

  uploading.value = true;

  try {
    const text = await file.text();
    const lines = text.split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    // 檢查必要欄位
    const requiredFields = ["name", "category", "lat", "lng", "address"];
    const missingFields = requiredFields.filter(
      (field) => !headers.includes(field)
    );

    if (missingFields.length > 0) {
      alert(`CSV 檔案缺少必要欄位: ${missingFields.join(", ")}`);
      return;
    }

    const successCount = await processCsvData(lines, headers);
    alert(`成功上傳 ${successCount} 筆地點資料`);
    await loadLocations(); // 重新載入資料
  } catch (error) {
    console.error("CSV 處理錯誤:", error);
    alert("CSV 檔案處理失敗，請檢查檔案格式");
  } finally {
    uploading.value = false;
    event.target.value = ""; // 清除檔案選擇
  }
}

async function processCsvData(lines, headers) {
  let successCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((v) => v.trim());
    const rowData = {};

    headers.forEach((header, index) => {
      rowData[header] = values[index] || "";
    });

    // 驗證必要資料
    if (!rowData.name || !rowData.category || !rowData.lat || !rowData.lng) {
      console.warn(`第 ${i + 1} 行資料不完整，跳過`);
      continue;
    }

    // 轉換座標為數字
    rowData.lat = parseFloat(rowData.lat);
    rowData.lng = parseFloat(rowData.lng);

    if (isNaN(rowData.lat) || isNaN(rowData.lng)) {
      console.warn(`第 ${i + 1} 行座標格式錯誤，跳過`);
      continue;
    }

    // 如果沒有地址，使用反向地理編碼產生
    if (!rowData.address && window.google?.maps) {
      try {
        const address = await reverseGeocodeForCsv(rowData.lat, rowData.lng);
        if (address) {
          rowData.address = address;
        }
      } catch (error) {
        console.warn(`第 ${i + 1} 行地址產生失敗:`, error);
      }
    }

    try {
      await addDoc(collection(db, "systemLocations"), rowData);
      successCount++;
    } catch (error) {
      console.error(`第 ${i + 1} 行儲存失敗:`, error);
    }
  }

  return successCount;
}

// 為 CSV 處理新增的反向地理編碼函數
async function reverseGeocodeForCsv(lat, lng) {
  return new Promise((resolve) => {
    if (!window.google?.maps) {
      resolve(null);
      return;
    }

    const geocoder = new google.maps.Geocoder();
    const latLng = new google.maps.LatLng(lat, lng);

    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        resolve(null);
      }
    });
  });
}

async function loadLocations() {
  loading.value = true;
  const snap = await getDocs(collection(db, "systemLocations"));
  locations.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  loading.value = false;
}

function editLocation(loc) {
  editingLocationData.value = loc;
  locationForm.value = { ...loc };
  showLocationModal.value = true;
}

function closeLocationModal() {
  showLocationModal.value = false;
  editingLocationData.value = null;
}

async function saveLocation() {
  if (saving.value) return;

  console.log("準備儲存的資料:", locationForm.value); // 除錯用

  // 檢查必要欄位
  if (!locationForm.value.name || !locationForm.value.category) {
    alert("請填寫完整的地點名稱和分類");
    return;
  }

  // 檢查座標
  if (
    !locationForm.value.lat ||
    !locationForm.value.lng ||
    locationForm.value.lat === 0 ||
    locationForm.value.lng === 0
  ) {
    alert("請選擇正確的地點以取得座標資訊");
    return;
  }

  saving.value = true;
  const data = { ...locationForm.value };

  try {
    if (editingLocationData.value) {
      await updateDoc(
        doc(db, "systemLocations", editingLocationData.value.id),
        data
      );
      console.log("更新成功:", data);
    } else {
      const docRef = await addDoc(collection(db, "systemLocations"), data);
      console.log("新增成功:", data, "文件ID:", docRef.id);
    }
    await loadLocations();
  } catch (error) {
    console.error("儲存失敗:", error);
    alert("儲存失敗，請重試");
  } finally {
    saving.value = false;
    closeLocationModal();
  }
}

async function deleteLocation(id) {
  if (!confirm("確定刪除此地點？")) return;
  await deleteDoc(doc(db, "systemLocations", id));
  await loadLocations();
}

onMounted(loadLocations);
</script>
