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
            {{ postForm.id ? "編輯任務" : "新增任務" }}
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
            <!-- 任務名稱 -->
            <div class="mb-3">
              <label class="form-label">任務名稱 *</label>
              <input
                class="form-control"
                required
                :value="postForm.name"
                @input="updateField('name', $event.target.value)"
                placeholder="輸入任務名稱"
              />
            </div>

            <!-- 任務內容 -->
            <div class="mb-3">
              <label class="form-label">任務內容 *</label>
              <textarea
                class="form-control"
                rows="4"
                required
                :value="postForm.content"
                @input="updateField('content', $event.target.value)"
                placeholder="描述任務詳情..."
              ></textarea>
            </div>

            <!-- 地址搜尋 -->
            <div class="mb-3">
              <label class="form-label">地址搜尋 *</label>
              <div class="d-flex gap-2">
                <div class="flex-grow-1 position-relative">
                  <input
                    ref="addressInput"
                    class="form-control"
                    required
                    :value="postForm.address || ''"
                    @input="updateField('address', $event.target.value)"
                    placeholder="🔍 搜尋地址或地點名稱..."
                  />
                  <!-- 搜尋建議下拉選單 -->
                  <div
                    v-if="addressSuggestions && addressSuggestions.length > 0"
                    class="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm"
                    style="z-index: 1000; max-height: 200px; overflow-y: auto"
                  >
                    <div
                      v-for="(place, index) in addressSuggestions"
                      :key="index"
                      class="p-3 border-bottom cursor-pointer hover-bg-light"
                      @click="selectAddress(place)"
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
                <button
                  type="button"
                  class="btn btn-success"
                  :disabled="gettingLocation"
                  @click="getCurrentLocation"
                  title="使用當前位置"
                >
                  {{ gettingLocation ? "定位中..." : "當前位置" }}
                </button>
              </div>
            </div>

            <!-- 顯示已選擇的地址座標資訊 -->
            <div v-if="postForm.lat && postForm.lng" class="alert alert-info">
              <small>
                座標：{{ postForm.lat.toFixed(4) }},
                {{ postForm.lng.toFixed(4) }}
              </small>
            </div>

            <!-- 發布者 -->
            <div class="mb-3">
              <label class="form-label">發布者 (可選)</label>
              <select
                class="form-select"
                :value="postForm.userId"
                @change="updateField('userId', $event.target.value)"
              >
                <option value="">選擇發布者</option>
                <option
                  v-for="parent in parents || []"
                  :key="parent.id"
                  :value="parent.id"
                >
                  {{ parent.displayName || parent.email || parent.id }}
                </option>
              </select>
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
            :disabled="
              saving || !postForm.address || !postForm.lat || !postForm.lng
            "
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

<script>
export default {
  name: "PostModal",
  props: {
    postForm: { type: Object, required: true },
    parents: { type: Array, default: () => [] },
    saving: { type: Boolean, default: false },
  },
  emits: ["close", "save", "update:postForm"],
  data() {
    return {
      addressSuggestions: [],
      searchTimeout: null,
      selecting: false,
      gettingLocation: false,
    };
  },
  methods: {
    updateField(key, value) {
      this.$emit("update:postForm", { ...this.postForm, [key]: value });
      if (key === "address" && !this.selecting) {
        if (value && value.length > 2) {
          this.searchAddresses(value);
        } else {
          this.addressSuggestions = [];
          // 清除座標當地址改變時
          if (this.postForm.lat || this.postForm.lng) {
            const updateData = { ...this.postForm };
            updateData.lat = 0;
            updateData.lng = 0;
            this.$emit("update:postForm", updateData);
          }
        }
      }
    },

    selectAddress(place) {
      this.selecting = true;
      this.addressSuggestions = [];

      console.log("選擇的地址:", place);

      // 取得詳細資訊
      if (place.place_id && window.google?.maps?.places) {
        const mapDiv = document.createElement("div");
        const service = new google.maps.places.PlacesService(mapDiv);

        service.getDetails(
          {
            placeId: place.place_id,
            fields: ["geometry", "formatted_address"],
          },
          (placeDetails, status) => {
            console.log("地址 API 回應狀態:", status);
            console.log("地址詳細資訊:", placeDetails);

            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              placeDetails
            ) {
              // 準備要更新的資料物件
              const updateData = { ...this.postForm };

              // 更新地址
              updateData.address =
                placeDetails.formatted_address || place.description;

              // 更新經緯度
              if (placeDetails.geometry && placeDetails.geometry.location) {
                const lat = placeDetails.geometry.location.lat();
                const lng = placeDetails.geometry.location.lng();
                console.log("取得地址座標:", lat, lng);
                updateData.lat = lat;
                updateData.lng = lng;
              } else {
                console.warn("沒有座標資訊");
              }

              // 一次性更新所有資料
              this.$emit("update:postForm", updateData);
            } else {
              console.warn("無法取得地址詳細資訊:", status);
            }
            this.selecting = false;
          }
        );
      } else {
        console.warn("Google Maps API 未載入或沒有 place_id");
        this.selecting = false;
      }
    },

    searchAddresses(query) {
      if (
        typeof google === "undefined" ||
        !google.maps ||
        !google.maps.places
      ) {
        console.warn("Google Maps API 未載入");
        return;
      }

      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      this.searchTimeout = setTimeout(() => {
        const service = new google.maps.places.AutocompleteService();

        const request = {
          input: query,
          componentRestrictions: { country: "tw" },
          types: ["address", "establishment", "geocode"],
        };

        service.getPlacePredictions(request, (predictions, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            this.addressSuggestions = predictions
              .slice(0, 5)
              .map((prediction) => ({
                place_id: prediction.place_id,
                description: prediction.description,
                name:
                  prediction.structured_formatting?.main_text ||
                  prediction.description,
                formatted_address:
                  prediction.structured_formatting?.secondary_text || "",
              }));
          } else {
            this.addressSuggestions = [];
          }
        });
      }, 300);
    },

    getCurrentLocation() {
      if (!navigator.geolocation) {
        alert("您的瀏覽器不支援定位功能");
        return;
      }

      this.gettingLocation = true;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // 使用 Google Maps Geocoding API 取得地址
          if (window.google?.maps) {
            const geocoder = new google.maps.Geocoder();
            const latlng = { lat, lng };

            geocoder.geocode({ location: latlng }, (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results[0]) {
                const updateData = { ...this.postForm };
                updateData.address = results[0].formatted_address;
                updateData.lat = lat;
                updateData.lng = lng;
                this.$emit("update:postForm", updateData);
              } else {
                // 如果無法取得地址，至少更新座標
                const updateData = { ...this.postForm };
                updateData.lat = lat;
                updateData.lng = lng;
                updateData.address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                this.$emit("update:postForm", updateData);
              }
              this.gettingLocation = false;
            });
          } else {
            // 如果沒有 Google Maps API，只更新座標
            const updateData = { ...this.postForm };
            updateData.lat = lat;
            updateData.lng = lng;
            updateData.address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            this.$emit("update:postForm", updateData);
            this.gettingLocation = false;
          }
        },
        (error) => {
          console.error("定位失敗:", error);
          alert("定位失敗，請手動輸入地址");
          this.gettingLocation = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    },

    handleClickOutside(event) {
      const container = this.$refs.addressInput?.closest(
        ".autocomplete-container"
      );
      if (container && !container.contains(event.target)) {
        this.addressSuggestions = [];
      }
    },
  },

  mounted() {
    document.addEventListener("click", this.handleClickOutside);
  },

  unmounted() {
    document.removeEventListener("click", this.handleClickOutside);
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },
};
</script>
