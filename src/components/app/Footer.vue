<script setup>
import { useAppStore } from "@/stores/app.js";

const appStore = useAppStore();
</script>

<template>
  <footer class="footer">
    <div class="footer__copyright">
      <p>{{ appStore.appConfig.footerText }}</p>
    </div>
  </footer>
</template>

<style scoped>
/* 页脚容器 */
.footer {
  background-color: #2c3e50;
  color: #ecf0f1;
  padding: 0 24px;
}

/* 版权行 */
.footer__copyright {
  text-align: center;
  padding-top: 20px;
  padding-bottom: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 1.2rem;
  color: #7f8c8d;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .footer {
    padding: 40px 0 20px;
  }
}
</style>