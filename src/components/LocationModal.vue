<template>
  <!-- Bootstrap Modal -->
  <div
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <!-- Modal Header -->
        <div class="modal-header">
          <h5 class="modal-title">
            {{ locationData.id ? "編輯系統地點" : "新增系統地點" }}
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
          ></button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <form @submit.prevent="$emit('save')">
            <!-- 地點名稱 -->
            <div class="mb-3">
              <label class="form-label">地點名稱 *</label>
              <div class="position-relative">
                <input
                  ref="placeInput"
                  class="form-control"
                  required
                  :value="locationData.name"
                  @input="updateField('name', $event.target.value)"
                  placeholder="輸入地點名稱搜尋..."
                />
                <!-- 搜尋建議下拉選單 -->
                <div
                  v-if="placeSuggestions && placeSuggestions.length > 0"
                  class="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm"
                  style="z-index: 1000; max-height: 200px; overflow-y: auto"
                >
                  <div
                    v-for="(place, index) in placeSuggestions"
                    :key="index"
                    class="p-3 border-bottom cursor-pointer"
                    @click="selectPlace(place)"
                    style="cursor: pointer"
                    @mouseover="$event.target.classList.add('bg-light')"
                    @mouseout="$event.target.classList.remove('bg-light')"
                  >
                    <div class="fw-semibold">
                      {{ place.name || place.description }}
                    </div>
                    <div class="small text-muted">
                      {{ place.formatted_address }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分類 -->
            <div class="mb-3">
              <label class="form-label">分類 *</label>
              <select
                class="form-select"
                required
                :value="locationData.category"
                @change="updateField('category', $event.target.value)"
              >
                <option value="">請選擇分類</option>
                <option value="公園">公園</option>
                <option value="捷運站">捷運站</option>
                <option value="火車站">火車站</option>
                <option value="醫院">醫院</option>
                <option value="學校">學校</option>
                <option value="商場">商場</option>
                <option value="餐廳">餐廳</option>
                <option value="景點">景點</option>
                <option value="辦公大樓">辦公大樓</option>
                <option value="住宅區">住宅區</option>
                <option value="其他">其他</option>
              </select>
            </div>

            <!-- 顯示已選擇的地點座標資訊 -->
            <div
              v-if="locationData.lat && locationData.lng"
              class="alert alert-info"
            >
              <small>
                座標：{{ locationData.lat.toFixed(4) }},
                {{ locationData.lng.toFixed(4) }}
              </small>
            </div>
          </form>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
            取消
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="saving || !locationData.name || !locationData.category"
            @click="$emit('save')"
          >
            <span
              v-if="saving"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            {{ saving ? "儲存中..." : "儲存" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  locationData: { type: Object, required: true },
  saving: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "save", "update:locationData"]);

const placeInput = ref(null);
const placeSuggestions = ref([]);
const searchTimeout = ref(null);
const selecting = ref(false);

function updateField(key, value) {
  emit("update:locationData", { ...props.locationData, [key]: value });
  if (key === "name" && !selecting.value) {
    if (value.length > 2) {
      searchPlaces(value);
    } else {
      placeSuggestions.value = [];
      // 清除座標當名稱改變時
      if (props.locationData.lat || props.locationData.lng) {
        updateField("lat", 0);
        updateField("lng", 0);
      }
    }
  }
}

function selectPlace(place) {
  selecting.value = true;
  updateField("name", place.name || place.description);
  placeSuggestions.value = [];

  console.log("選擇的地點:", place); // 除錯用

  // 取得詳細資訊
  if (place.place_id && window.google?.maps?.places) {
    const mapDiv = document.createElement("div");
    const service = new google.maps.places.PlacesService(mapDiv);

    service.getDetails(
      {
        placeId: place.place_id,
        fields: ["geometry", "types"],
      },
      (placeDetails, status) => {
        console.log("API 回應狀態:", status); // 除錯用
        console.log("地點詳細資訊:", placeDetails); // 除錯用

        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          placeDetails
        ) {
          // 準備要更新的資料物件
          const updateData = { ...props.locationData };

          // 更新經緯度
          if (placeDetails.geometry && placeDetails.geometry.location) {
            const lat = placeDetails.geometry.location.lat();
            const lng = placeDetails.geometry.location.lng();
            console.log("取得座標:", lat, lng); // 除錯用
            updateData.lat = lat;
            updateData.lng = lng;
          } else {
            console.warn("沒有座標資訊");
          }

          // 更新分類
          if (placeDetails.types) {
            const cat = inferCategory(placeDetails.types);
            if (cat) {
              updateData.category = cat;
            }
          }

          // 一次性更新所有資料
          emit("update:locationData", updateData);
        } else {
          console.warn("無法取得地點詳細資訊:", status);
        }
        selecting.value = false;
      }
    );
  } else {
    console.warn("Google Maps API 未載入或沒有 place_id");
    console.log("Google Maps 狀態:", {
      google: typeof google !== "undefined",
      maps: window.google?.maps,
      places: window.google?.maps?.places,
      place_id: place.place_id,
    });
    selecting.value = false;
  }
}

function searchPlaces(query) {
  if (typeof google === "undefined" || !google.maps || !google.maps.places) {
    console.warn("Google Maps API 未載入");
    return;
  }

  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(() => {
    const service = new google.maps.places.AutocompleteService();

    const request = {
      input: query,
      componentRestrictions: { country: "tw" },
      types: ["establishment", "geocode"],
    };

    service.getPlacePredictions(request, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        placeSuggestions.value = predictions.slice(0, 5).map((prediction) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          name:
            prediction.structured_formatting?.main_text ||
            prediction.description,
          formatted_address:
            prediction.structured_formatting?.secondary_text || "",
        }));
      } else {
        placeSuggestions.value = [];
      }
    });
  }, 300);
}

function inferCategory(types) {
  const categoryMap = {
    park: "公園",
    amusement_park: "公園",
    national_park: "公園",
    subway_station: "捷運站",
    transit_station: "捷運站",
    train_station: "火車站",
    hospital: "醫院",
    school: "學校",
    university: "學校",
    shopping_mall: "商場",
    shopping_center: "商場",
    restaurant: "餐廳",
    food: "餐廳",
    meal_takeaway: "餐廳",
    tourist_attraction: "景點",
    point_of_interest: "景點",
    premise: "辦公大樓",
    establishment: "其他",
  };

  for (const type of types) {
    if (categoryMap[type]) {
      return categoryMap[type];
    }
  }

  return null;
}

function handleClickOutside(event) {
  const container = placeInput.value?.closest(".autocomplete-container");
  if (container && !container.contains(event.target)) {
    placeSuggestions.value = [];
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 24px 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #ecf0f1;
  color: #2c3e50;
}

.modal-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-select {
  background: white;
  cursor: pointer;
}

.autocomplete-container {
  position: relative;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: #f8f9fa;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-name {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
}

.suggestion-address {
  font-size: 12px;
  color: #7f8c8d;
}

.coords-info {
  margin-bottom: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.coords-text {
  color: #7f8c8d;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-secondary,
.btn-primary {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
}

.btn-secondary:hover {
  background: #d5dbdb;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style>
