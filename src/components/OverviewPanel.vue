<template>
  <div class="card">
    <!-- Panel Header -->
    <div class="card-header">
      <h5 class="card-title mb-0">數據總覽</h5>
    </div>

    <!-- Panel Body -->
    <div class="card-body">
      <div class="row g-4">
        <!-- 最新任務卡片 -->
        <div class="col-lg-6">
          <div class="card h-100">
            <div class="card-header">
              <h6 class="card-title mb-0">最新任務</h6>
            </div>
            <div class="card-body">
              <!-- 空狀態 -->
              <div
                v-if="recent.length === 0"
                class="text-center text-muted py-3"
              >
                <p class="mb-0">暫無最新任務</p>
              </div>
              <!-- 最新任務列表 -->
              <div v-else class="d-flex flex-column gap-3">
                <div
                  v-for="p in recent"
                  :key="p.id"
                  class="border-bottom pb-3"
                  :class="{
                    'border-bottom-0': p === recent[recent.length - 1],
                  }"
                >
                  <div
                    class="d-flex justify-content-between align-items-start mb-2"
                  >
                    <strong class="text-primary">{{ p.name }}</strong>
                    <small class="text-muted">{{
                      formatDate(p.createdAt)
                    }}</small>
                  </div>
                  <p class="text-muted mb-2 small">
                    {{ truncate(p.content, 50) }}
                  </p>
                  <div class="d-flex justify-content-end">
                    <span class="badge bg-info">
                      {{ (p.applicants || []).length }} 人應徵
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 熱門位置卡片 -->
        <div class="col-lg-6">
          <div class="card h-100">
            <div class="card-header">
              <h6 class="card-title mb-0">熱門位置</h6>
            </div>
            <div class="card-body">
              <!-- 空狀態 -->
              <div
                v-if="popular.length === 0"
                class="text-center text-muted py-3"
              >
                <p class="mb-0">暫無位置數據</p>
              </div>
              <!-- 熱門位置列表 -->
              <div v-else class="d-flex flex-column gap-2">
                <div
                  v-for="(loc, index) in popular"
                  :key="loc.name"
                  class="d-flex justify-content-between align-items-center p-2 rounded"
                  :class="{ 'bg-light': index % 2 === 0 }"
                >
                  <div class="d-flex align-items-center">
                    <span class="badge bg-secondary me-2"
                      >#{{ index + 1 }}</span
                    >
                    <span class="fw-semibold">{{ loc.name }}</span>
                  </div>
                  <span class="badge bg-primary"> {{ loc.count }} 個任務 </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "OverviewPanel",
  props: {
    recent: Array,
    popular: Array,
  },
  methods: {
    formatDate(ts) {
      if (!ts) return "";
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return (
        d.toLocaleDateString("zh-TW") +
        " " +
        d.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })
      );
    },
    truncate(txt, len) {
      return txt && txt.length > len ? txt.slice(0, len) + "…" : txt;
    },
  },
};
</script>
