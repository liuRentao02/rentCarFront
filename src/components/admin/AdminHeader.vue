<script setup>
import { computed } from 'vue'
import {
  ElHeader,
  ElRow,
  ElCol,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElAvatar,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElIcon,
  ElMessage,
  ElMessageBox
} from 'element-plus'
import { CaretBottom } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app.js'
import { useRoute, useRouter } from 'vue-router'
import ChatBox from "@/components/common/ChatBox.vue";

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const logoutAdmin = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    appStore.clearUserData()
    router.push('/')
    ElMessage.success('已退出登录')
  }).catch(() => {})
}

const breadcrumbs = computed(() => {
  return route.matched.filter(item => item.meta && item.meta.title)
})
</script>

<template>
  <el-header class="app-header">
    <el-row :gutter="20" align="middle" justify="space-between">
      <el-col :span="12">
        <div class="left-panel">
          <el-image :src="appStore.appConfig.logo" fit="cover"  />
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">
              <el-text type="primary" size="large">{{ appStore.appConfig.platformName }} 后台管理</el-text>
            </el-breadcrumb-item>
            <el-breadcrumb-item
                v-for="(item, index) in breadcrumbs"
                :key="item.path"
                :to="index === breadcrumbs.length - 1 ? null : item.path"
            >
              <el-text type="info" size="large">{{ item.meta.title }}</el-text>
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </el-col>

      <el-col :span="12">
        <div class="right-panel">
          <ChatBox icon-color="white"/>
<!--          <Dark />-->
          <el-dropdown trigger="hover">
            <div class="user-info">
              <el-avatar :src="appStore.userInfo?.avatar">
                <span>管理员</span>
              </el-avatar>
              <el-text class="user-name" size="large">{{ appStore.userInfo?.realName || '超级管理员' }}</el-text>
              <el-icon class="arrow-down"><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/admin/personalCenter')">个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="logoutAdmin">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-col>
    </el-row>
  </el-header>
</template>

<style scoped>
.app-header {
  border-bottom: 1px solid var(--el-border-color);
  box-shadow: var(--el-box-shadow-light);
  display: flex;
  align-items: center;
  background-color: var(--admin-header-back);
}

.el-header :deep(.el-row) {
  width: 100%;
  height: 100%;
}

.left-panel {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.left-panel .el-icon {
  margin: 10px;
  font-size: 18px;
  cursor: pointer;
  color: var(--admin-header-text);
}

.left-panel .el-image {
  width: 48px;
  height: 48px;
  border-radius: 10px;
}

.left-panel .el-breadcrumb .el-text {
  color: var(--admin-header-text);
}

.right-panel {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  height: 100%;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 6px;
}

.user-name {
  color: var(--admin-header-text);
}

.arrow-down {
  font-size: 12px;
  color: var(--admin-header-text);
}
</style>