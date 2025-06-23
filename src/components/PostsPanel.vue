<template>
  <div class="card">
    <!-- Panel Header -->
    <div class="card-header">
      <div class="d-flex justify-content-between align-items-center w-100">
        <h5 class="card-title mb-0">任務管理</h5>
        <button class="btn btn-primary" @click="openCreateModal">
          新增任務
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
              v-model="localQuery"
              class="form-control"
              placeholder="搜尋任務名稱或內容..."
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
        <div class="display-1 mb-3">📝</div>
        <h5>目前沒有任務</h5>
        <p class="text-muted">點擊「新增任務」按鈕來創建第一個任務</p>
      </div>

      <!-- Table -->
      <div v-else class="table-responsive">
        <table class="table table-hover">
          <thead class="table-light">
            <tr>
              <th>任務名稱</th>
              <th>發布者</th>
              <th>內容</th>
              <th>地址</th>
              <th>位置</th>
              <th>應徵者</th>
              <th>創建時間</th>
              <th width="120">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in filtered" :key="post.id">
              <td>
                <strong>{{ post.name }}</strong>
              </td>
              <td>
                <span class="badge bg-secondary">
                  {{ post.publisherName || "未知用戶" }}
                </span>
              </td>
              <td>
                <span class="text-muted">
                  {{ truncate(post.content, 30) }}
                </span>
              </td>
              <td>
                <small class="text-muted">
                  {{ truncate(post.address || "未指定", 25) }}
                </small>
              </td>
              <td>
                <code class="small">
                  {{ post.lat?.toFixed(4) }},{{ post.lng?.toFixed(4) }}
                </code>
              </td>
              <td>
                <span class="badge bg-info">
                  {{ (post.applicants || []).length }} 人
                </span>
              </td>
              <td>
                <small class="text-muted">
                  {{ formatDate(post.createdAt) }}
                </small>
              </td>
              <td>
                <div class="btn-group btn-group-sm" role="group">
                  <button
                    class="btn btn-outline-secondary"
                    @click="editPost(post)"
                    title="編輯"
                  >
                    編輯
                  </button>
                  <button
                    class="btn btn-outline-danger"
                    @click="deletePost(post.id)"
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

    <!-- PostModal -->
    <PostModal
      v-if="showModal"
      :postForm="postForm"
      :parents="parents || []"
      :saving="saving"
      @close="closeModal"
      @save="savePost"
      @update:postForm="updatePostForm"
    />
  </div>
</template>

<script>
import PostModal from "./PostModal.vue";

export default {
  name: "PostsPanel",
  components: {
    PostModal,
  },
  props: {
    loading: Boolean,
    posts: { type: Array, default: () => [] },
    parents: { type: Array, default: () => [] },
    searchQuery: String,
  },
  emits: ["update:searchQuery", "create", "edit", "delete"],
  data() {
    return {
      showModal: false,
      saving: false,
      editingPost: null,
      postForm: {
        name: "",
        content: "",
        address: "",
        lat: 0,
        lng: 0,
        userId: "",
      },
    };
  },
  computed: {
    localQuery: {
      get() {
        return this.searchQuery;
      },
      set(v) {
        this.$emit("update:searchQuery", v);
      },
    },
    filtered() {
      if (!this.localQuery) return this.posts || [];
      const q = this.localQuery.toLowerCase();
      return (this.posts || []).filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.content || "").toLowerCase().includes(q) ||
          (p.address || "").toLowerCase().includes(q)
      );
    },
  },
  methods: {
    truncate(text, len) {
      return text && text.length > len ? text.slice(0, len) + "…" : text;
    },

    formatDate(ts) {
      if (!ts) return "未知";
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return (
        d.toLocaleDateString("zh-TW") +
        " " +
        d.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })
      );
    },

    // 處理子組件的更新
    updatePostForm(newData) {
      console.log("父組件收到任務更新:", newData);
      this.postForm = { ...newData };
    },

    openCreateModal() {
      this.editingPost = null;
      this.postForm = {
        name: "",
        content: "",
        address: "",
        lat: 0,
        lng: 0,
        userId: "",
      };
      this.showModal = true;
    },

    editPost(post) {
      this.editingPost = post;
      this.postForm = { ...post };
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.editingPost = null;
    },

    async savePost() {
      if (this.saving) return;

      console.log("準備儲存的任務資料:", this.postForm);

      // 檢查必要欄位
      if (
        !this.postForm.name ||
        !this.postForm.content ||
        !this.postForm.address
      ) {
        alert("請填寫完整的任務名稱、內容和地址");
        return;
      }

      // 檢查座標
      if (
        !this.postForm.lat ||
        !this.postForm.lng ||
        this.postForm.lat === 0 ||
        this.postForm.lng === 0
      ) {
        alert("請選擇正確的地址以取得座標資訊");
        return;
      }

      this.saving = true;

      try {
        if (this.editingPost) {
          // 發送編輯事件給父組件，包含完整的資料
          this.$emit("edit", { ...this.editingPost, ...this.postForm });
        } else {
          // 發送創建事件給父組件
          this.$emit("create", this.postForm);
        }

        // 成功後關閉 modal
        this.closeModal();
      } catch (error) {
        console.error("儲存失敗:", error);
        alert("儲存失敗，請重試");
      } finally {
        this.saving = false;
      }
    },

    deletePost(id) {
      if (!confirm("確定刪除此任務？")) return;
      this.$emit("delete", id);
    },
  },
};
</script>
