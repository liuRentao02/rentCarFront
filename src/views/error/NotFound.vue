<template>
  <div class="error-page">
    <div class="error-container">
      <div class="error-code">404</div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-desc">您访问的页面不存在或已被移除</p>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button @click="goBack">返回上一页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.error-container {
  text-align: center;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  min-height: 600px;
  width: 90%;
}

.error-code {
  font-size: 240px;
  font-weight: 700;
  color: var(--el-color-primary);
  line-height: 1;
  margin-bottom: 20px;
  text-shadow: 4px 4px 0 rgba(0, 0, 0, 0.05);
}

.error-title {
  font-size: 50px;
  font-weight: 600;
  margin: 0 0 12px;
  color: #2c3e50;
}

.error-desc {
  font-size: 25px;
  color: #7f8c8d;
  margin-bottom: 32px;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>