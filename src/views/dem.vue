//src/views/BackView.vue
<template>
  <div class="admin-container">
    <!-- 通知组件 -->
    <Transition name="notification">
      <div v-if="notification" class="notification" :class="notificationType">
        <div class="notification-content">
          <i class="notification-icon">{{ getNotificationIcon() }}</i>
          <span>{{ notification }}</span>
        </div>
      </div>
    </Transition>

    <!-- 头部 -->
    <header class="header">
      <div class="header-content">
        <div class="header-info">
          <h1>🚀 MVP App 後台管理系統</h1>
          <p class="subtitle">管理您的應用數據、用戶和內容</p>
        </div>
        <div class="header-actions">
          <button class="btn-refresh" @click="refreshData" :disabled="loading">
            <i class="icon" :class="{ spinning: loading }">🔄</i>
            重新整理
          </button>
        </div>
      </div>
    </header>

    <!-- 统计卡片 -->
    <section class="stats-section">
      <div class="stats-grid">
        <div v-for="stat in statsData" :key="stat.key" class="stat-card">
          <div class="stat-icon">{{ stat.icon }}</div>
          <div class="stat-content">
            <div class="stat-title">{{ stat.title }}</div>
            <div class="stat-value">
              <transition name="number" mode="out-in">
                <span :key="stat.value">{{ stat.value }}</span>
              </transition>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 导航标签 -->
    <nav class="tabs-nav">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
          @click="switchTab(tab.id)"
        >
          {{ tab.name }}
        </button>
      </div>
    </nav>

    <!-- 内容面板 -->
    <main class="content-main">
      <!-- 任务管理面板 -->
      <section v-if="activeTab === 'posts'" class="content-panel">
        <div class="panel-header">
          <h2 class="panel-title">📝 任務管理</h2>
          <button class="btn-refresh" @click="openCreatePostModal">
            <i>➕</i> 新增任務
          </button>
        </div>

        <div class="panel-controls">
          <div class="search-container">
            <input
              v-model="searchQuery"
              class="search-box"
              placeholder="🔍 搜尋任務名稱或內容..."
            />
          </div>
        </div>

        <div class="table-container">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>載入中...</p>
          </div>

          <div v-else-if="filteredPosts.length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>目前沒有任務</h3>
            <p>點擊「新增任務」按鈕來創建第一個任務</p>
          </div>

          <div v-else class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>任務名稱</th>
                  <th>發布者</th>
                  <th>內容</th>
                  <th>位置</th>
                  <th>應徵者</th>
                  <th>創建時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="post in filteredPosts"
                  :key="post.id"
                  class="table-row"
                >
                  <td>
                    <div class="task-name">{{ post.name }}</div>
                  </td>
                  <td>
                    <div class="publisher-info">
                      <div class="user-avatar">
                        {{ getInitials(post.publisherName) }}
                      </div>
                      <span>{{ post.publisherName || "未知用戶" }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="content-preview" :title="post.content">
                      {{ truncateText(post.content, 30) }}
                    </div>
                  </td>
                  <td>
                    <div class="location-info">
                      <div class="coordinates">
                        {{ post.lat?.toFixed(4) }}, {{ post.lng?.toFixed(4) }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="applicant-badge">
                      {{ (post.applicants || []).length }} 人
                    </span>
                  </td>
                  <td>
                    <div class="date-info">
                      {{ formatDate(post.createdAt) }}
                    </div>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button
                        class="btn-action btn-edit"
                        @click="editPost(post)"
                        title="編輯"
                      >
                        ✏️
                      </button>
                      <button
                        class="btn-action btn-delete"
                        @click="deletePost(post.id)"
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- 用户管理面板 -->
      <section v-if="activeTab === 'users'" class="content-panel">
        <div class="panel-header">
          <h2 class="panel-title">👥 用戶管理</h2>
          <div class="filter-controls">
            <select v-model="userTypeFilter" class="filter-select">
              <option value="">所有用戶</option>
              <option value="parents">家長</option>
              <option value="players">玩家</option>
              <option value="groups">團體</option>
            </select>
          </div>
        </div>

        <div class="panel-controls">
          <div class="search-container">
            <input
              v-model="userSearchQuery"
              class="search-box"
              placeholder="🔍 搜尋用戶名稱或郵箱..."
            />
          </div>
        </div>

        <div class="table-container">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>載入中...</p>
          </div>

          <div v-else-if="filteredUsers.length === 0" class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>沒有找到用戶</h3>
            <p>嘗試調整搜尋條件或篩選器</p>
          </div>

          <div v-else class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>用戶</th>
                  <th>類型</th>
                  <th>Email</th>
                  <th>聯絡方式</th>
                  <th>自我介紹</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="user in filteredUsers"
                  :key="user.id"
                  class="table-row"
                >
                  <td>
                    <div class="user-info">
                      <div class="user-avatar large">
                        {{ getInitials(user.displayName || user.email) }}
                      </div>
                      <div class="user-details">
                        <div class="user-name">
                          {{ user.displayName || "未設定" }}
                        </div>
                        <div class="user-id">
                          {{ user.id.substring(0, 8) }}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      class="status-badge"
                      :class="getUserTypeClass(user.userType)"
                    >
                      {{ getUserTypeName(user.userType) }}
                    </span>
                  </td>
                  <td>
                    <div class="email-info">{{ user.email || "未設定" }}</div>
                  </td>
                  <td>
                    <div class="contact-info">
                      {{ user.contact || "未設定" }}
                    </div>
                  </td>
                  <td>
                    <div class="bio-preview" :title="user.bio">
                      {{ truncateText(user.bio, 40) || "無" }}
                    </div>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button
                        class="btn-action btn-view"
                        @click="viewUser(user)"
                        title="查看"
                      >
                        👁️
                      </button>
                      <button
                        class="btn-action btn-delete"
                        @click="deleteUser(user)"
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- 数据总览面板 -->
      <section v-if="activeTab === 'overview'" class="content-panel">
        <h2 class="panel-title">📊 數據總覽</h2>

        <div class="overview-grid">
          <div class="overview-card">
            <h3 class="card-title"><i>🆕</i> 最新任務</h3>
            <div v-if="recentPosts.length === 0" class="empty-state mini">
              <p>暫無最新任務</p>
            </div>
            <div v-else class="recent-posts">
              <div
                v-for="post in recentPosts"
                :key="post.id"
                class="recent-item"
              >
                <div class="item-header">
                  <strong class="item-title">{{ post.name }}</strong>
                  <span class="item-date">{{
                    formatDate(post.createdAt)
                  }}</span>
                </div>
                <div class="item-content">
                  {{ truncateText(post.content, 50) }}
                </div>
                <div class="item-footer">
                  <span class="applicant-count"
                    >{{ (post.applicants || []).length }} 人應徵</span
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="overview-card">
            <h3 class="card-title"><i>📍</i> 熱門位置</h3>
            <div v-if="popularLocations.length === 0" class="empty-state mini">
              <p>暫無位置數據</p>
            </div>
            <div v-else class="popular-locations">
              <div
                v-for="location in popularLocations"
                :key="location.name"
                class="location-item"
              >
                <div class="location-name">{{ location.name }}</div>
                <div class="location-count">{{ location.count }} 個任務</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 新增/编辑任务模态框 -->
    <Transition name="modal">
      <div v-if="showPostModal" class="modal-overlay" @click="closePostModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">
              {{ editingPostData ? "編輯任務" : "新增任務" }}
            </h3>
            <button class="modal-close" @click="closePostModal">✕</button>
          </div>

          <form @submit.prevent="savePost" class="modal-form">
            <div class="form-group">
              <label class="form-label">任務名稱 *</label>
              <input
                v-model="postForm.name"
                class="form-input"
                placeholder="輸入任務名稱"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">任務內容 *</label>
              <textarea
                v-model="postForm.content"
                class="form-textarea"
                placeholder="描述任務詳情..."
                required
              ></textarea>
            </div>

            <!-- 地址搜尋和位置選擇 -->
            <div class="form-group">
              <label class="form-label">地址搜尋</label>

              <!-- 地址搜尋框 -->
              <div class="address-search-container">
                <input
                  ref="addressInput"
                  v-model="addressQuery"
                  class="form-input address-input"
                  placeholder="🔍 搜尋地址或地點名稱，將自動填入經緯度..."
                  @input="onAddressSearch"
                />
                <button
                  type="button"
                  class="btn-location"
                  @click="getCurrentLocation"
                  :disabled="gettingLocation"
                  title="使用當前位置"
                >
                  {{ gettingLocation ? "定位中..." : "📍 當前位置" }}
                </button>
              </div>

              <!-- 選中地址顯示 -->
              <div v-if="selectedAddress" class="selected-address">
                <div class="address-info">
                  <span class="address-icon">📍</span>
                  <span class="address-text">{{ selectedAddress }}</span>
                  <button
                    type="button"
                    class="btn-clear"
                    @click="clearAddress"
                    title="清除地址"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <!-- 手動輸入經緯度 -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">緯度 *</label>
                <input
                  v-model.number="postForm.lat"
                  class="form-input"
                  type="number"
                  step="any"
                  placeholder="25.0479"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">經度 *</label>
                <input
                  v-model.number="postForm.lng"
                  class="form-input"
                  type="number"
                  step="any"
                  placeholder="121.5171"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">發布者 (可選)</label>
              <select v-model="postForm.userId" class="form-select">
                <option value="">選擇發布者</option>
                <option
                  v-for="parent in parents"
                  :key="parent.id"
                  :value="parent.id"
                >
                  {{ parent.displayName || parent.email || parent.id }}
                </option>
              </select>
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="btn-secondary"
                @click="closePostModal"
              >
                取消
              </button>
              <button
                type="submit"
                class="btn-refresh"
                :disabled="saving || !postForm.lat || !postForm.lng"
              >
                <span v-if="saving">儲存中...</span>
                <span v-else">儲存</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- 用户详情模态框 -->
    <Transition name="modal">
      <div v-if="showUserModal" class="modal-overlay" @click="closeUserModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">用戶詳情</h3>
            <button class="modal-close" @click="closeUserModal">✕</button>
          </div>

          <div v-if="selectedUser" class="user-details-content">
            <div class="user-profile">
              <div class="profile-avatar">
                {{
                  getInitials(selectedUser.displayName || selectedUser.email)
                }}
              </div>
              <div class="profile-info">
                <h4 class="profile-name">
                  {{ selectedUser.displayName || "未設定名稱" }}
                </h4>
                <p class="profile-email">
                  {{ selectedUser.email || "未設定郵箱" }}
                </p>
                <span
                  class="status-badge"
                  :class="getUserTypeClass(selectedUser.userType)"
                >
                  {{ getUserTypeName(selectedUser.userType) }}
                </span>
              </div>
            </div>

            <div class="details-grid">
              <div class="detail-item">
                <label class="detail-label">聯絡方式</label>
                <div class="detail-value">
                  {{ selectedUser.contact || "未設定" }}
                </div>
              </div>

              <div class="detail-item">
                <label class="detail-label">自我介紹</label>
                <div class="detail-value">
                  {{ selectedUser.bio || "無自我介紹" }}
                </div>
              </div>

              <div
                v-if="selectedUser.userType === 'players'"
                class="detail-item"
              >
                <label class="detail-label">期望時薪</label>
                <div class="detail-value">
                  {{
                    selectedUser.hourlyRate
                      ? `$${selectedUser.hourlyRate}`
                      : "未設定"
                  }}
                </div>
              </div>

              <div class="detail-item">
                <label class="detail-label">用戶 ID</label>
                <div class="detail-value code">{{ selectedUser.id }}</div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-refresh" @click="closeUserModal">關閉</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
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

export default {
  name: "BackView",

};
</script>

可以怎麼拆成 component 我的資料不要跑掉附上檔案存放路徑