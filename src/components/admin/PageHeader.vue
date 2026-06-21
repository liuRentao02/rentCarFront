<template>
  <div class="page-header">
    <div class="page-header__left">
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="description" class="page-header__description">{{ description }}</p>
    </div>
    <div class="page-header__right">
      <!-- 默认插槽：放置主要操作按钮 -->
      <slot></slot>
      <!-- 具名插槽：放置额外操作区域 -->
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header__left {
  flex: 1;
  min-width: 0; /* 防止标题过长溢出 */
}

.page-header__title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--el-text-color-primary);
  line-height: 1.3;
  word-break: break-word;
}

.page-header__description {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.page-header__right {
  flex-shrink: 0;
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .page-header__right {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>