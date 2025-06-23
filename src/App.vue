<template>
  <div id="app" class="p-4">
    <Suspense>
      <template #default>
        <router-view />
      </template>
      <template #fallback>
        <div class="d-flex justify-content-center align-items-center vh-100">
          <div class="text-center">
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">載入中...</span>
            </div>
            <p class="text-muted">載入中...</p>
          </div>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script>
export default {
  name: 'App',
  created() {
    console.log('App created');
    // 檢查 Firebase 配置
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      console.warn('Firebase configuration missing. Please check your .env file.')
    }
  },
  mounted() {
    console.log('App mounted');
  }
}
</script>

