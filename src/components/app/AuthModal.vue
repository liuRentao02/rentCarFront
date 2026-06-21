<template>
  <Teleport to="body">
    <div v-if="visible" class="auth-overlay auth-overlay--visible" @click.self="close">
      <div class="auth-modal" @click.stop>
        <button type="button" class="auth-modal__close" @click="close" aria-label="关闭">✕</button>

        <div class="auth-modal__header">
          <a href="/" class="auth-modal__logo">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
            </svg>
            {{ appStore.appConfig?.platformName }}
          </a>
          <p class="auth-modal__tagline">开启您的非凡旅程</p>
        </div>

        <div class="auth-modal__body">
          <LoginForm
              v-if="component === 'login'"
              @login-success="handleLoginSuccess"
              @switch-to-register="component = 'register'"
              @forgot-password="component = 'forgot'"
          />
          <RegisterForm
              v-else-if="component === 'register'"
              @register-success="handleRegisterSuccess"
              @switch-to-login="component = 'login'"
          />
          <ForgotPasswordForm
              v-else-if="component === 'forgot'"
              @back-to-login="component = 'login'"
              @go-to-home="close"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'
import ForgotPasswordForm from '@/components/app/ForgotPasswordForm.vue'
import {useAppStore} from "@/stores/app.js";

const appStore = useAppStore()
const component = ref('login')


const props = defineProps({
  visible: { type: Boolean, default: false },
  page: { type: String, default: 'login' }
})
const emit = defineEmits(['update:visible', 'loginSuccess'])

let escHandler = null

watch(
    () => props.visible,
    (val) => {
      if (val) {
        component.value = props.page
        escHandler = (e) => { if (e.key === 'Escape') close() }
        document.addEventListener('keydown', escHandler)
      } else {
        if (escHandler) {
          document.removeEventListener('keydown', escHandler)
          escHandler = null
        }
      }
    }
)

onUnmounted(() => {
  if (escHandler) document.removeEventListener('keydown', escHandler)
})

const close = () => {
  component.value = 'login'
  emit('update:visible', false)
}

const handleLoginSuccess = (userInfo) => {
  emit('loginSuccess', userInfo)
  close()
}

const handleRegisterSuccess = () => {
  // 注册成功后可根据需要处理，如自动切换登录或关闭弹窗
}
</script>

<style scoped>
/* 保留原有样式，但删除了未使用的 .auth-modal__tabs、.auth-modal__tab 等样式（因为模板中未使用） */
/* 同时整理顺序，去除冗余 */
.auth-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}
.auth-overlay--visible {
  opacity: 1;
  visibility: visible;
}
.auth-modal {
  width: 100%;
  max-width: 650px;
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transform: scale(0.9) translateY(20px);
  transition: transform 0.3s ease;
  position: relative;
}
.auth-overlay--visible .auth-modal {
  transform: scale(1) translateY(0);
}
.auth-modal__header {
  padding: 30px 40px 20px;
  text-align: center;
  background: linear-gradient(135deg, var(--primary-light), var(--white));
}
.auth-modal__logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 1.6rem;
  font-weight: 700;
  font-family: 'Poppins', 'Noto Sans SC', sans-serif;
  color: var(--primary-color);
  text-decoration: none;
  margin-bottom: 8px;
}
.auth-modal__tagline {
  font-size: 0.9rem;
  color: var(--text-light);
}
.auth-modal__body {
  padding: 30px 40px 40px;
}
.auth-modal__close {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--bg-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  color: var(--text-light);
  font-size: 1.2rem;
  z-index: 10;
}
.auth-modal__close:hover {
  background: var(--error-color);
  color: var(--white);
  transform: rotate(90deg);
}
</style>