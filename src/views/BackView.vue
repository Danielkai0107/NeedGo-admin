<template>
  <div class="container-fluid">
    <Notification :message="notification" :type="notificationType" />

    <!-- Header -->
    <header class="bg-primary text-white py-4 mb-4 rounded p-5">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h1 class="h3 mb-1">MVP App 後台管理系統</h1>
          <p class="mb-0 opacity-75">管理您的應用數據、用戶和內容</p>
        </div>
        <div>
          <button
            class="btn btn-light"
            @click="refreshData"
            :disabled="loading"
          >
            <i
              class="me-2"
              :class="{ 'spinner-border spinner-border-sm': loading }"
              v-if="loading"
            ></i>
            重新整理
          </button>
        </div>
      </div>
    </header>

    <!-- Stats Section -->
    <div class="row g-3 mb-4">
      <div v-for="stat in statsData" :key="stat.key" class="col-md-6 col-lg-2">
        <div class="card text-center h-100">
          <div class="card-body">
            <h6 class="card-title text-muted">{{ stat.title }}</h6>
            <div class="fs-4 fw-bold text-primary">{{ stat.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <ul class="nav nav-pills mb-4" role="tablist">
      <li class="nav-item" v-for="tab in tabs" :key="tab.id">
        <button
          class="nav-link"
          :class="{ active: activeTab === tab.id }"
          @click="switchTab(tab.id)"
          type="button"
        >
          {{ tab.name }}
        </button>
      </li>
    </ul>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Posts Panel -->
      <div
        class="tab-pane fade"
        :class="{ 'show active': activeTab === 'posts' }"
        v-if="activeTab === 'posts'"
      >
        <PostsPanel
          :loading="loading"
          :posts="posts"
          :parents="parents"
          :searchQuery="searchQuery"
          @update:searchQuery="searchQuery = $event"
          @create="handleCreatePost"
          @edit="handleEditPost"
          @delete="handleDeletePost"
        />
      </div>

      <!-- Users Panel -->
      <div
        class="tab-pane fade"
        :class="{ 'show active': activeTab === 'users' }"
        v-if="activeTab === 'users'"
      >
        <UsersPanel
          :loading="loading"
          :users="users"
          :userTypeFilter="userTypeFilter"
          :userSearchQuery="userSearchQuery"
          @update:userTypeFilter="userTypeFilter = $event"
          @update:userSearchQuery="userSearchQuery = $event"
          @view="viewUser"
          @delete="deleteUser"
        />
      </div>

      <!-- Overview Panel -->
      <div
        class="tab-pane fade"
        :class="{ 'show active': activeTab === 'overview' }"
        v-if="activeTab === 'overview'"
      >
        <OverviewPanel :recent="recentPosts" :popular="popularLocations" />
      </div>

      <!-- Locations Panel -->
      <div
        class="tab-pane fade"
        :class="{ 'show active': activeTab === 'locations' }"
        v-if="activeTab === 'locations'"
      >
        <SystemLocationsPanel />
      </div>
    </div>

    <!-- User Modal -->
    <UserModal
      v-if="showUserModal"
      :user="selectedUser"
      @close="closeUserModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

import Notification from "../components/Notification.vue";
import PostsPanel from "../components/PostsPanel.vue";
import UsersPanel from "../components/UsersPanel.vue";
import OverviewPanel from "../components/OverviewPanel.vue";
import UserModal from "../components/UserModal.vue";
import SystemLocationsPanel from "../components/SystemLocationsPanel.vue";

// state
const loading = ref(false);
const notification = ref("");
const notificationType = ref("success");
const activeTab = ref("posts");

const searchQuery = ref("");
const userSearchQuery = ref("");
const userTypeFilter = ref("");

const posts = ref([]);
const users = ref([]);
const parents = ref([]);
const players = ref([]);
const groups = ref([]);

const showUserModal = ref(false);
const selectedUser = ref(null);

const tabs = [
  { id: "posts", name: "任務管理" },
  { id: "users", name: "用戶管理" },
  { id: "overview", name: "數據總覽" },
  { id: "locations", name: "系統地點" },
];

// computed
const statsData = computed(() => [
  {
    key: "totalUsers",
    title: "總用戶數",
    value: users.value.length,
  },
  {
    key: "activePosts",
    title: "活躍任務",
    value: posts.value.length,
  },
  {
    key: "parents",
    title: "家長用戶",
    value: parents.value.length,
  },
  {
    key: "players",
    title: "玩家用戶",
    value: players.value.length,
  },
  { key: "groups", title: "團體用戶", value: groups.value.length },
]);

const recentPosts = computed(() =>
  posts.value
    .filter((p) => p.createdAt)
    .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
    .slice(0, 5)
);

const popularLocations = computed(() => {
  const counts = {};
  posts.value.forEach((p) => {
    const n = p.name || "未知";
    counts[n] = (counts[n] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
});

// methods
function showNotification(msg, type = "success") {
  notification.value = msg;
  notificationType.value = type;
  setTimeout(() => (notification.value = ""), 3000);
}

function switchTab(id) {
  activeTab.value = id;
}

async function refreshData() {
  await initializeData();
  showNotification("數據已更新");
}

// firebase actions
async function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const arr = [];
  for (const docSnap of snap.docs) {
    const data = { id: docSnap.id, ...docSnap.data() };
    if (data.userId) {
      const u = await getDoc(doc(db, "parents", data.userId));
      data.publisherName = u.exists() ? u.data().displayName : "未知用戶";
    }
    arr.push(data);
  }
  posts.value = arr;
}

async function loadUsers() {
  const [pS, plS, gS] = await Promise.all([
    getDocs(collection(db, "parents")),
    getDocs(collection(db, "players")),
    getDocs(collection(db, "groups")),
  ]);
  parents.value = pS.docs.map((d) => ({
    id: d.id,
    userType: "parents",
    ...d.data(),
  }));
  players.value = plS.docs.map((d) => ({
    id: d.id,
    userType: "players",
    ...d.data(),
  }));
  groups.value = gS.docs.map((d) => ({
    id: d.id,
    userType: "groups",
    ...d.data(),
  }));
  users.value = [...parents.value, ...players.value, ...groups.value];
}

async function initializeData() {
  loading.value = true;
  try {
    await Promise.all([loadPosts(), loadUsers()]);
  } catch {
    showNotification("載入失敗", "error");
  } finally {
    loading.value = false;
  }
}

// 處理 PostsPanel 的事件
async function handleCreatePost(postData) {
  console.log("創建任務:", postData);
  try {
    const data = {
      name: postData.name,
      content: postData.content,
      address: postData.address,
      lat: postData.lat,
      lng: postData.lng,
      userId: postData.userId || null,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "posts"), data);
    showNotification("任務創建成功");
    await loadPosts();
  } catch (error) {
    console.error("創建失敗:", error);
    showNotification("創建失敗", "error");
  }
}

async function handleEditPost(postData) {
  console.log("編輯任務:", postData);
  try {
    const { id, ...updateData } = postData;
    const data = {
      name: updateData.name,
      content: updateData.content,
      address: updateData.address,
      lat: updateData.lat,
      lng: updateData.lng,
      userId: updateData.userId || null,
    };

    await updateDoc(doc(db, "posts", id), data);
    showNotification("任務更新成功");
    await loadPosts();
  } catch (error) {
    console.error("更新失敗:", error);
    showNotification("更新失敗", "error");
  }
}

async function handleDeletePost(postId) {
  console.log("刪除任務:", postId);
  try {
    await deleteDoc(doc(db, "posts", postId));
    showNotification("任務刪除成功");
    await loadPosts();
  } catch (error) {
    console.error("刪除失敗:", error);
    showNotification("刪除失敗", "error");
  }
}

// user CRUD
function viewUser(u) {
  selectedUser.value = u;
  showUserModal.value = true;
}

function closeUserModal() {
  showUserModal.value = false;
  selectedUser.value = null;
}

async function deleteUser(u) {
  if (!confirm(`刪除 ${u.displayName || u.email}？`)) return;
  await deleteDoc(doc(db, u.userType, u.id));
  showNotification("用戶刪除成功");
  await loadUsers();
}

onMounted(initializeData);
</script>

<style scoped>
/* 你可以添加一些自定義樣式來覆蓋 Bootstrap 的預設樣式 */
.nav-link {
  cursor: pointer;
}
</style>
