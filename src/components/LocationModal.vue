<!-- LocationModal.vue -->

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

async function reverseGeocode(lat, lng) {
  return new Promise((resolve) => {
    if (!window.google?.maps) {
      console.warn("Google Maps API 未載入");
      resolve(null);
      return;
    }

    const geocoder = new google.maps.Geocoder();
    const latLng = new google.maps.LatLng(lat, lng);

    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results[0]) {
        const address = results[0].formatted_address;
        console.log("反向地理編碼取得地址:", address);
        resolve(address);
      } else {
        console.warn("反向地理編碼失敗:", status);
        resolve(null);
      }
    });
  });
}

async function selectPlace(place) {
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
        fields: ["geometry", "types", "formatted_address"],
      },
      async (placeDetails, status) => {
        console.log("API 回應狀態:", status);
        console.log("地點詳細資訊:", placeDetails);

        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          placeDetails
        ) {
          const updateData = { ...props.locationData };

          // 更新經緯度
          if (placeDetails.geometry && placeDetails.geometry.location) {
            const lat = placeDetails.geometry.location.lat();
            const lng = placeDetails.geometry.location.lng();
            console.log("取得座標:", lat, lng);
            updateData.lat = lat;
            updateData.lng = lng;
          }

          // 更新地址
          if (placeDetails.formatted_address) {
            updateData.address = placeDetails.formatted_address;
            console.log("取得地址:", placeDetails.formatted_address);
          } else if (updateData.lat && updateData.lng) {
            // 如果沒有 formatted_address，使用反向地理編碼
            const address = await reverseGeocode(
              updateData.lat,
              updateData.lng
            );
            if (address) {
              updateData.address = address;
            }
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
