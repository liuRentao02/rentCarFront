<template>
  <header class="header" role="banner">
    <div class="container">
      <nav class="header__nav" role="navigation" aria-label="主导航">
        <!-- Logo -->
        <router-link to="/" class="header__logo" aria-label="{{appStore.appConfig?.platformName}} 首页">
          <div class="logo">
            <el-image :src="appStore.appConfig.logo" fit="cover" />
          </div>
          {{ appStore.appConfig.platformName }}
        </router-link>

        <!-- 主导航菜单 -->
        <el-menu
            :default-active="route.path"
            mode="horizontal"
            router
            class="header__menu"
            :ellipsis="false"
        >
          <el-menu-item
              v-for="item in menuItems"
              :key="item.path"
              :index="item.path"
          >
            <el-text style="font-size: 18px; color: var(--text-dark);">
              {{ item.title }}
            </el-text>
          </el-menu-item>
        </el-menu>

        <!-- 右侧操作区：根据登录状态显示 -->
        <div class="header__actions">
          <ChatBox v-if="appStore.token !== ''" icon-color="back"/>
          <template v-if="!userInfo">
            <!-- 未登录：显示登录/注册 -->
            <el-link
                underline="never"
                class="header__login"
                @click.prevent="openAuthModal('login')"
            >
              登录
            </el-link>
            <el-button
                class="header__register"
                type="primary"
                @click.prevent="openAuthModal('register')"
            >
              注册
            </el-button>
          </template>
          <template v-else>
            <!-- 已登录：显示用户头像和下拉菜单 -->
            <el-dropdown
                trigger="click"
                @command="handleCommand"
                placement="bottom-end"
            >
              <div class="user-info">
                <el-avatar :size="36" :src="userInfo?.avatar" class="user-avatar">
                  {{ userInfo.username?.charAt(0) || 'U' }}
                </el-avatar>
                <span class="username">{{ userInfo.username }}</span>
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="notice">
                    我的通知
                  </el-dropdown-item>
                  <el-dropdown-item command="profile">
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="password">修改密码</el-dropdown-item>
                  <el-dropdown-item command="orders">我的订单</el-dropdown-item>
                  <el-dropdown-item command="reviews">我的评论</el-dropdown-item>
                  <el-dropdown-item
                      v-if="role === 'admin'"
                      command="admin"
                  >
                    后台管理
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </div>
      </nav>
    </div>
  </header>

  <AuthModal ref="authModalRef" v-model:visible="showModal" :page="showModalRef" />
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMenu, ElMenuItem, ElButton, ElLink, ElDropdown, ElDropdownMenu, ElDropdownItem, ElAvatar, ElIcon, ElImage } from "element-plus";
import { ArrowDown } from '@element-plus/icons-vue';
import { useAppStore } from "@/stores/app"; // 根据实际路径调整
import AuthModal from "@/components/app/AuthModal.vue";
import { ElMessage, ElMessageBox } from 'element-plus';
import ChatBox from "@/components/common/ChatBox.vue"; // 新增导入
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
// 从 store 获取用户信息和角色（响应式）
const userInfo = computed(() => appStore.userInfo);
const role = computed(() => appStore.role);

const showModal = ref(false);
const showModalRef = ref(null);

const menuItems = [
  { path: '/', title: '首页' },
  { path: '/fleet', title: '车型列表' },
  { path: '/reviews', title: '客户评论' },
  { path: '/contact', title: '联系我们' },
];

// 打开登录/注册弹窗，并指定激活标签
const openAuthModal = (type) => {
  showModal.value = true;
  showModalRef.value = type;
};

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile');
      break;
    case 'password':
      router.push("/password");
      break;
    case 'admin':
      router.push('/admin');
      break;
    case 'orders':
      router.push('/profile/orders');
      break;
    case 'reviews':
      router.push('/profile/reviews');
      break;
    case "notice":
      router.push('/profile/notice');
      break;
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        appStore.clearUserData()
        router.push('/');
        ElMessage.success('已退出登录');
      }).catch(() => {});
      break;
    default:
      break;
  }
};
</script>

<style scoped>
.header {
  background-color: var(--white);
  box-shadow: var(--shadow-sm);
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
}
.header__nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}
.header__logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}
.logo {
  width: 48px;
  height: 46px;
  border-radius: 10px;
  overflow: hidden;
}
.header__menu {
  flex: 1;
  justify-content: center;
  background-color: transparent !important;
  border-bottom: none !important;
  height: 70px;
}
.header__menu :deep(.el-menu-item) {
  font-weight: 500;
  color: var(--text-dark);
  transition: var(--transition);
  background-color: transparent !important;
  border-bottom-color: transparent !important;
  height: 70px;
  line-height: 70px;
}
.header__menu :deep(.el-menu-item.is-active) {
  color: var(--primary-color) !important;
  border-bottom-color: var(--primary-color) !important;
}
.header__menu :deep(.el-menu-item:hover) {
  color: var(--primary-color) !important;
  background-color: transparent !important;
}
.header__actions {
  display: flex;
  gap: 15px;
  align-items: center;
}
.header__login {
  color: var(--primary-color);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.95rem;
}
.header__register {
  background-color: var(--primary-color);
  color: var(--white);
  padding: 8px 20px;
  border-radius: 6px;
  text-decoration: none;
  transition: var(--transition);
  border: none;
  font-weight: 600;
}
.header__register:hover {
  background-color: var(--primary-dark);
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 30px;
  transition: var(--transition);
}
.user-info:hover {
  background-color: var(--bg-light);
}
.user-avatar {
  background-color: var(--primary-color);
  color: white;
  font-weight: 600;
}
.username {
  font-size: 1rem;
  color: var(--text-dark);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.container {
  width: 90%;
  margin: 0 auto;
  padding: 0 15px;
}
@media (max-width: 768px) {
  .header__menu,
  .header__actions {
    display: none;
  }
}
</style>