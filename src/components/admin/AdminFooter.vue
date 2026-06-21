<template>
  <div class="end">
    <el-text type="info" size="large">
<!--      © 2026 QuickWheels 校园租车平台 后台管理系统-->
      {{ appStore.appConfig.footerText }}
    </el-text>
  </div>
</template>

<script setup>
import {useAppStore} from "@/stores/app.js";
const appStore = useAppStore();
</script>

<style scoped>
.end {
  display: flex;
  align-items: center;      /* 垂直居中 */
  justify-content: center;  /* 水平居中 */
  border-top: 1px solid var(--el-color-primary-light-9);
  width: 100%;
  box-sizing: border-box;   /* 防止内边距撑大宽度 */
  min-height: 60px;         /* 保证一定高度，使垂直居中可见 */
  padding: 0;
  margin: 0;
}
</style>