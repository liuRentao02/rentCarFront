<script setup>
import { useRoute } from 'vue-router'
import {
  Setting,
  Clock,
  Tickets,
  Monitor,
  Goods,
  Location,
  User,
  Document,
  School,
  Van,
  SetUp,
  Files,
  CircleCheck,
  ChatLineRound, ChatLineSquare
} from '@element-plus/icons-vue'

const route = useRoute()
</script>

<template>
  <el-aside class="app-sidebar" width="auto">
    <el-scrollbar height="100%">
      <el-menu
          :default-active="route.path"
          router
          class="sidebar-menu"
      >
        <el-menu-item index="/admin">
          <el-icon><Monitor /></el-icon>
          <template #title>
            <el-text size="large" tag="b">首页概览</el-text>
          </template>
        </el-menu-item>

        <el-sub-menu index="vehicle">
          <template #title>
            <el-icon><Van /></el-icon>
            <el-text size="large" tag="b" style="margin-left: 5px">车辆管理</el-text>
          </template>
          <el-menu-item index="/admin/vehicle/list" class="sub-menu">
            <el-icon><Files /></el-icon>
            <template #title>
              <el-text size="large" tag="b">车辆列表</el-text>
            </template>
          </el-menu-item>
          <el-menu-item index="/admin/vehicle/carModel" class="sub-menu">
            <el-icon><Van /></el-icon>
            <template #title>
              <el-text size="large" tag="b">车型管理</el-text>
            </template>
          </el-menu-item>
          <el-menu-item index="/admin/vehicle/maintenance" class="sub-menu">
            <el-icon><CircleCheck /></el-icon>
            <template #title>
              <el-text size="large" tag="b">维修保养</el-text>
            </template>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/admin/order">
          <el-icon><Tickets /></el-icon>
          <template #title>
            <el-text size="large" tag="b">租赁订单</el-text>
          </template>
        </el-menu-item>

        <el-menu-item index="/admin/user/list">
          <el-icon>
            <User/>
          </el-icon>
          <template #title>
            <el-text size="large" tag="b">用户列表</el-text>
          </template>
        </el-menu-item>
        <el-menu-item index="/admin/user/role">
          <el-icon>
            <SetUp/>
          </el-icon>
          <template #title>
            <el-text size="large" tag="b">用户权限</el-text>
          </template>
        </el-menu-item>

        <el-menu-item index="/admin/service">
          <el-icon><Goods /></el-icon>
          <template #title>
            <el-text size="large" tag="b">服务管理</el-text>
          </template>
        </el-menu-item>

        <el-menu-item index="/admin/review">
          <el-icon><ChatLineSquare /></el-icon>
          <template #title>
            <el-text size="large" tag="b">评论管理</el-text>
          </template>
        </el-menu-item>

        <el-menu-item index="/admin/notice">
          <el-icon><Document /></el-icon>
          <template #title>
            <el-text size="large" tag="b">公告管理</el-text>
          </template>
        </el-menu-item>
        <el-menu-item index="/admin/contact">
          <el-icon><ChatLineRound /></el-icon>
          <template #title>
            <el-text size="large" tag="b">留言管理</el-text>
          </template>
        </el-menu-item>

        <el-menu-item index="/admin/certification">
          <el-icon><School /></el-icon>
          <template #title>
            <el-text size="large" tag="b">学生认证</el-text>
          </template>
        </el-menu-item>
        <el-menu-item index="/admin/system">
          <el-icon><Setting /></el-icon>
          <template #title>
            <el-text size="large" tag="b">系统设置</el-text>
          </template>
        </el-menu-item>

        <el-menu-item index="/admin/station">
          <el-icon><Location /></el-icon>
          <template #title>
            <el-text size="large" tag="b">网点管理</el-text>
          </template>
        </el-menu-item>

        <el-menu-item index="/admin/log">
          <el-icon><Clock /></el-icon>
          <template #title>
            <el-text size="large" tag="b">日志管理</el-text>
          </template>
        </el-menu-item>
      </el-menu>
    </el-scrollbar>
  </el-aside>
</template>

<style scoped>
.app-sidebar {
  height: calc(100vh - 60px);
  background-color: var(--bg-light);
  border-right: 1px solid var(--primary-light);
  transition: width 0.3s;
  overflow-y: hidden;
}

.sidebar-menu {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: var(--bg-light);
  border-right: none;
}

.sub-menu {
  background-color: var(--bg-light);
}

.el-sub-menu .el-menu-item {
  margin: 0 !important;
  padding: 5px;
  background-color: var(--bg-light);
}

.sidebar-menu .el-icon {
  font-size: 1.5em;
}

.el-menu:not(.el-menu--collapse) {
  width: 200px;
}

/* 图标与文字间距 */
.el-menu-item [class^="el-icon"] {
  margin-right: 8px;
}

.el-menu--collapse .el-menu-item [class^="el-icon"] {
  margin-right: 0;
}

/* 分割线 */
.el-divider {
  margin: 8px 0;
}

/* 激活菜单项文字颜色（使用 primary 色） */
.el-menu-item.is-active .el-text {
  color: var(--el-color-primary) !important;
}

/* 悬浮和激活菜单项背景 */
.el-menu-item:hover,
.el-sub-menu:hover,
.el-menu-item.is-active {
  background-color: var(--primary-light);
  border-radius: 10px;
}

/* 收缩状态下的悬浮/激活样式 */
.el-menu--collapse .el-menu-item:hover,
.el-menu--collapse .el-menu-item.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  margin: 0;
}

/* 分组标题 */
.menu-group-title {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  margin: 8px;
  padding: 12px 0 4px 20px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  transition: all 0.3s ease;
}

/* 子菜单项左对齐 */
.el-sub-menu .el-menu-item {
  margin-top: 5px;
  margin-bottom: 5px;
  padding-left: 30px !important;
}

/* 收缩时隐藏子菜单的文字 */
.el-menu--collapse .el-sub-menu .el-sub-menu__title .el-text,
.el-menu--collapse .el-sub-menu .el-sub-menu__title span:not(.el-icon) {
  display: none;
}
</style>