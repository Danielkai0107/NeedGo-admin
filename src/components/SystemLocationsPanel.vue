<template>
  <div class="card">
    <!-- Panel Header -->
    <div class="card-header">
      <div class="d-flex justify-content-between align-items-center w-100">
        <h5 class="card-title mb-0">系統地點管理</h5>
        <button class="btn btn-primary" @click="openCreateLocationModal">
          新增地點
        </button>
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
const locationForm = ref({ name: "", category: "", lat: 0, lng: 0 });

const filteredLocations = computed(() => {
  if (!searchQuery.value) return locations.value;
  const q = searchQuery.value.toLowerCase();
  return locations.value.filter(
    (l) =>
      l.name.toLowerCase().includes(q) || l.category.toLowerCase().includes(q)
  );
});

// 新增這個函數來處理子組件的更新
function updateLocationForm(newData) {
  console.log("父組件收到更新:", newData); // 除錯用
  locationForm.value = { ...newData };
}

async function loadLocations() {
  loading.value = true;
  const snap = await getDocs(collection(db, "systemLocations"));
  locations.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  loading.value = false;
}

function openCreateLocationModal() {
  editingLocationData.value = null;
  locationForm.value = { name: "", category: "", lat: 0, lng: 0 };
  showLocationModal.value = true;
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
