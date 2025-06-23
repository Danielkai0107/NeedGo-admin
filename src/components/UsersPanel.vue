<template>
  <div class="card">
    <!-- Panel Header -->
    <div class="card-header">
      <div class="d-flex justify-content-between align-items-center w-100">
        <h5 class="card-title mb-0">用戶管理</h5>
        <select v-model="localType" class="form-select" style="width: auto">
          <option value="">所有用戶</option>
          <option value="parents">家長</option>
          <option value="players">玩家</option>
          <option value="groups">團體</option>
        </select>
      </div>
    </div>

    <!-- Panel Controls -->
    <div class="card-body">
      <div class="row mb-3">
        <div class="col-md-6">
          <div class="input-group">
            <span class="input-group-text">🔍</span>
            <input
              v-model="localQuery"
              class="form-control"
              placeholder="搜尋用戶名稱或郵箱..."
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
      <div v-else-if="filtered.length === 0" class="text-center py-5">
        <h5>沒有找到用戶</h5>
        <p class="text-muted">嘗試調整搜尋條件或篩選器</p>
      </div>

      <!-- Table -->
      <div v-else class="table-responsive">
        <table class="table table-hover">
          <thead class="table-light">
            <tr>
              <th>用戶</th>
              <th>類型</th>
              <th>Email</th>
              <th>聯絡方式</th>
              <th>自我介紹</th>
              <th width="160">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filtered" :key="u.id">
              <td>
                <strong>{{ u.displayName || u.email || u.id }}</strong>
              </td>
              <td>
                <span class="badge" :class="getTypeClass(u.userType)">
                  {{ typeName(u.userType) }}
                </span>
              </td>
              <td>
                <span class="text-muted">{{ u.email || "未設定" }}</span>
              </td>
              <td>
                <span class="text-muted">{{ u.contact || "未設定" }}</span>
              </td>
              <td>
                <span class="text-muted">{{
                  truncate(u.bio, 40) || "無"
                }}</span>
              </td>
              <td>
                <div class="btn-group btn-group-sm" role="group">
                  <button
                    class="btn btn-outline-primary"
                    @click="$emit('view', u)"
                  >
                    查看
                  </button>
                  <button
                    class="btn btn-outline-danger"
                    @click="$emit('delete', u)"
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
  </div>
</template>

<script>
export default {
  name: "UsersPanel",
  props: {
    loading: Boolean,
    users: Array,
    userTypeFilter: String,
    userSearchQuery: String,
  },
  emits: ["update:userTypeFilter", "update:userSearchQuery", "view", "delete"],
  computed: {
    localType: {
      get() {
        return this.userTypeFilter;
      },
      set(v) {
        this.$emit("update:userTypeFilter", v);
      },
    },
    localQuery: {
      get() {
        return this.userSearchQuery;
      },
      set(v) {
        this.$emit("update:userSearchQuery", v);
      },
    },
    filtered() {
      let arr = this.users;
      if (this.localType)
        arr = arr.filter((u) => u.userType === this.localType);
      if (this.localQuery) {
        const q = this.localQuery.toLowerCase();
        arr = arr.filter(
          (u) =>
            (u.displayName || "").toLowerCase().includes(q) ||
            (u.email || "").toLowerCase().includes(q) ||
            (u.bio || "").toLowerCase().includes(q)
        );
      }
      return arr;
    },
  },
  methods: {
    truncate(txt, len) {
      return txt && txt.length > len ? txt.slice(0, len) + "…" : txt;
    },
    typeName(t) {
      return { parents: "家長", players: "玩家", groups: "團體" }[t] || "未知";
    },
    getTypeClass(userType) {
      const typeClasses = {
        parents: "bg-primary",
        players: "bg-success",
        groups: "bg-warning",
      };
      return typeClasses[userType] || "bg-secondary";
    },
  },
};
</script>
