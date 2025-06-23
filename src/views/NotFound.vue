<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1 class="error-title">頁面未找到</h1>
      <p class="error-description">
        抱歉，您訪問的頁面不存在或已被移除。
      </p>
      <div class="error-actions">
        <button @click="goHome" class="btn-primary">
          🏠 返回首頁
        </button>
        <button @click="goBack" class="btn-secondary">
          ← 返回上頁
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'NotFound',
  setup() {
    const router = useRouter()

    const goHome = () => {
      router.push('/')
    }

    const goBack = () => {
      router.go(-1)
    }

    return {
      goHome,
      goBack
    }
  }
}
</script>

