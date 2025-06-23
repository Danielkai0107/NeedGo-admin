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
          <h5 class="modal-title">用戶詳情</h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
          ></button>
        </div>

        <!-- Modal Body -->
        <div v-if="user" class="modal-body">
          <!-- User Profile Section -->
          <div class="d-flex align-items-center mb-4 p-3 bg-light rounded">
            <div class="me-3">
              <div
                class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                style="
                  width: 60px;
                  height: 60px;
                  font-size: 1.5rem;
                  font-weight: bold;
                "
              >
                {{ initials }}
              </div>
            </div>
            <div class="flex-grow-1">
              <h4 class="mb-1">
                {{ user.displayName || "未設定名稱" }}
              </h4>
              <p class="text-muted mb-2">
                {{ user.email || "未設定郵箱" }}
              </p>
              <span class="badge" :class="statusClass">
                {{ typeName }}
              </span>
            </div>
          </div>

          <!-- Details Grid -->
          <div class="row g-3">
            <div class="col-md-6">
              <div class="card h-100">
                <div class="card-body">
                  <h6 class="card-subtitle mb-2 text-muted">聯絡方式</h6>
                  <p class="card-text">
                    {{ user.contact || "未設定" }}
                  </p>
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="card h-100">
                <div class="card-body">
                  <h6 class="card-subtitle mb-2 text-muted">自我介紹</h6>
                  <p class="card-text">
                    {{ user.bio || "無自我介紹" }}
                  </p>
                </div>
              </div>
            </div>

            <div v-if="user.userType === 'players'" class="col-md-6">
              <div class="card h-100">
                <div class="card-body">
                  <h6 class="card-subtitle mb-2 text-muted">期望時薪</h6>
                  <p class="card-text">
                    <span v-if="user.hourlyRate" class="badge bg-success fs-6">
                      ${{ user.hourlyRate }}
                    </span>
                    <span v-else class="text-muted">未設定</span>
                  </p>
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="card h-100">
                <div class="card-body">
                  <h6 class="card-subtitle mb-2 text-muted">用戶 ID</h6>
                  <p class="card-text">
                    <code class="small">{{ user.id }}</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" @click="$emit('close')">
            關閉
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "UserModal",
  props: {
    user: { type: Object, default: null },
  },
  emits: ["close"],
  computed: {
    initials() {
      if (!this.user) return "U";
      const name = this.user.displayName || this.user.email || "";
      return name.charAt(0).toUpperCase();
    },
    typeName() {
      const map = { parents: "家長", players: "玩家", groups: "團體" };
      return map[this.user?.userType] || "未知";
    },
    statusClass() {
      const map = {
        parents: "status-active",
        players: "status-pending",
        groups: "status-inactive",
      };
      return map[this.user?.userType] || "";
    },
  },
};
</script>
