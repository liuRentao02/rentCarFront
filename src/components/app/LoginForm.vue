<template>
  <div class="auth-modal__form auth-modal__form--active">
    <form @submit.prevent="handleLogin">
      <div class="auth-modal__group">
        <div class="auth-modal__login-tabs">
          <button
              type="button"
              class="auth-modal__login-tab"
              :class="{ 'auth-modal__login-tab--active': loginType === 'phone' }"
              @click="loginType = 'phone'"
          >
            手机号
          </button>
          <button
              type="button"
              class="auth-modal__login-tab"
              :class="{ 'auth-modal__login-tab--active': loginType === 'email' }"
              @click="loginType = 'email'"
          >
            邮箱
          </button>
          <button
              type="button"
              class="auth-modal__login-tab"
              :class="{ 'auth-modal__login-tab--active': loginType === 'username' }"
              @click="loginType = 'username'"
          >
            用户名
          </button>
        </div>
        <label class="auth-modal__label"
        >账号 <span class="required">*</span></label
        >
        <div class="auth-modal__input-wrapper">
          <input
              type="text"
              v-model="form.account"
              class="auth-modal__input"
              :class="{ 'auth-modal__input--error': errors.account }"
              :placeholder="accountPlaceholder"
              required
              autocomplete="username"
          />
          <span class="auth-modal__input-icon">👤</span>
        </div>
        <div
            v-if="errors.account"
            class="auth-modal__error auth-modal__error--visible"
        >
          <span>⚠️</span><span>{{ errors.account }}</span>
        </div>
      </div>

      <div class="auth-modal__group">
        <label class="auth-modal__label"
        >密码 <span class="required">*</span></label
        >
        <div class="auth-modal__input-wrapper">
          <input
              :type="passwordVisible ? 'text' : 'password'"
              v-model="form.password"
              class="auth-modal__input"
              :class="{ 'auth-modal__input--error': errors.password }"
              placeholder="请输入密码"
              required
              autocomplete="current-password"
          />
          <span class="auth-modal__input-icon">🔒</span>
          <button
              type="button"
              class="auth-modal__password-toggle"
              @click="passwordVisible = !passwordVisible"
          >
            {{ passwordVisible ? '🙈' : '👁️' }}
          </button>
        </div>
        <div
            v-if="errors.password"
            class="auth-modal__error auth-modal__error--visible"
        >
          <span>⚠️</span><span>{{ errors.password }}</span>
        </div>
      </div>

      <div class="auth-modal__group">
        <label class="auth-modal__label"
        >验证码 <span class="required">*</span></label
        >
        <div class="auth-modal__captcha">
          <div class="auth-modal__input-wrapper">
            <input
                type="text"
                v-model="form.captcha"
                class="auth-modal__input"
                placeholder="请输入验证码"
                required
                maxlength="4"
                autocomplete="off"
            />
            <span class="auth-modal__input-icon">🔢</span>
          </div>
          <div class="auth-modal__captcha-img" @click="handleCaptcha">
            <el-image :src="captchaImg"/>
          </div>
        </div>
      </div>

      <div class="auth-modal__options">
        <label class="auth-modal__remember">
          <input type="checkbox" v-model="form.remember" /><span>记住我</span>
        </label>
        <a href="#" class="auth-modal__forgot" @click.prevent="$emit('forgot-password')">忘记密码？</a>
      </div>

      <button
          type="submit"
          class="auth-modal__submit"
          :class="{ 'auth-modal__submit--loading': loading }"
          :disabled="loading"
      >
        <span class="auth-modal__submit-text">登录</span>
        <span class="auth-modal__submit-loading">
          <span class="auth-modal__spinner"></span>
          <span>登录中...</span>
        </span>
      </button>

      <div class="auth-modal__switch">
        还没有账号？
        <button type="button" class="auth-modal__link" @click="$emit('switch-to-register')">
          立即注册
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useAppStore } from '@/stores/app';
import {mainRequest} from "@/api/index.js";

const appStore = useAppStore();
const emit = defineEmits(['loginSuccess', 'switch-to-register', 'forgot-password']);

const loginType = ref('phone'); // phone, email, username

const form = reactive({
  account: '',
  password: '',
  captcha: '',
  remember: false,
});

const errors = reactive({
  account: '',
  password: '',
});

const loading = ref(false);
const passwordVisible = ref(false);

// 验证码
const captcha = ref('');
const captchaImg = ref('');
const handleCaptcha = async () => {
  const res = await mainRequest({
    url: '/auth/captcha',
    method: 'get',
    params: {
      w: 180,
      h: 60,
      s: 4
    }
  })
  captchaImg.value = res.image;
  captcha.value = res.code;
};

const accountPlaceholder = computed(() => {
  if (loginType.value === 'phone') return '请输入手机号';
  if (loginType.value === 'email') return '请输入邮箱';
  return '请输入用户名';
});

// 验证（简单格式检查）
const validate = () => {
  let valid = true;
  const account = form.account.trim();
  const password = form.password;

  if (!account) {
    errors.account = '请输入账号';
    valid = false;
  } else {
    if (loginType.value === 'phone' && !/^1[3-9]\d{9}$/.test(account)) {
      errors.account = '手机号格式不正确';
      valid = false;
    } else if (loginType.value === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)) {
      errors.account = '邮箱格式不正确';
      valid = false;
    } else {
      errors.account = '';
    }
  }

  if (!password) {
    errors.password = '请输入密码';
    valid = false;
  } else if (password.length < 6) {
    errors.password = '密码长度至少6位';
    valid = false;
  } else {
    errors.password = '';
  }

  return valid;
};

const handleLogin = async () => {
  if (!validate()) return;
  loading.value = true;
  try {
    if (captcha.value !== form.captcha) {
      ElMessage.warning('验证码输入错误');
      await handleCaptcha();
      return;
    }
    const response = await mainRequest({
      url: '/auth/login',
      method: 'post',
      data:{
        account: form.account.trim(),
        password: form.password,
      },
    })
    appStore.token = response.token;
    appStore.userInfo = response.userInfo;
    appStore.role = response.role[0].authority;
    // 直接触发登录成功事件，关闭弹窗
    ElMessage.success('登录成功');
    emit('loginSuccess', appStore.userInfo);
  } catch (error) {
    console.error('登录失败', error);
    ElMessage.error(error || '登录失败');
    await handleCaptcha(); // 刷新验证码
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  handleCaptcha();
});
</script>

<style scoped>
.auth-overlay--visible .auth-modal {
  transform: scale(1) translateY(0);
}
.auth-modal__login-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  justify-content: space-between;
}
.auth-modal__login-tab {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-light);
  cursor: pointer;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  transition: var(--transition);
}
.auth-modal__login-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.auth-modal__login-tab {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-light);
  cursor: pointer;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  transition: var(--transition);
}
.auth-modal__login-tab--active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}
.auth-modal__form {
  display: none;
}
.auth-modal__form--active {
  display: block;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.auth-modal__group {
  margin-bottom: 20px;
}
.auth-modal__label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-dark);
}
.auth-modal__label .required {
  color: var(--error-color);
  margin-left: 2px;
}
.auth-modal__input-wrapper {
  position: relative;
}
.auth-modal__input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 1.1rem;
  pointer-events: none;
  transition: var(--transition);
}
.auth-modal__input {
  width: 100%;
  padding: 14px 14px 14px 44px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-family: inherit;
  color: var(--text-dark);
  background: var(--white);
  transition: var(--transition);
}
.auth-modal__input::placeholder {
  color: var(--text-muted);
}
.auth-modal__input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(0, 86, 179, 0.1);
}
.auth-modal__input:focus + .auth-modal__input-icon,
.auth-modal__input-wrapper:hover .auth-modal__input-icon {
  color: var(--primary-color);
}
.auth-modal__input--error {
  border-color: var(--error-color);
}
.auth-modal__input--error:focus {
  box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.1);
}
.auth-modal__error {
  display: none;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 0.85rem;
  color: var(--error-color);
}
.auth-modal__error--visible {
  display: flex;
}
.auth-modal__captcha {
  display: flex;
  gap: 12px;
  align-items: center;
}
.auth-modal__captcha .auth-modal__input-wrapper {
  flex: 1;
}
.auth-modal__captcha-img {
  width: 180px;
  height: 60px;
  border-radius: var(--radius-sm);
  background: var(--bg-light);
  border: 1px solid var(--border-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  color: var(--text-light);
  transition: var(--transition);
  flex-shrink: 0;
}
.auth-modal__captcha-img:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}
.auth-modal__options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}
.auth-modal__remember {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-light);
}
.auth-modal__remember input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: var(--primary-color);
  cursor: pointer;
}
.auth-modal__forgot {
  font-size: 0.9rem;
  color: var(--primary-color);
  text-decoration: none;
  transition: var(--transition);
}
.auth-modal__forgot:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}
.auth-modal__submit {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: var(--white);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1.1rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}
.auth-modal__submit::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}
.auth-modal__submit:hover::before {
  left: 100%;
}
.auth-modal__submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 86, 179, 0.35);
}
.auth-modal__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}
.auth-modal__submit--loading {
  pointer-events: none;
}
.auth-modal__submit-text {
  display: inline;
}
.auth-modal__submit-loading {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.auth-modal__submit--loading .auth-modal__submit-text {
  display: none;
}
.auth-modal__submit--loading .auth-modal__submit-loading {
  display: flex;
}
.auth-modal__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--white);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-modal__agreement a {
  color: var(--primary-color);
  text-decoration: none;
}
.auth-modal__agreement a:hover {
  text-decoration: underline;
}

.auth-modal__password-toggle {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.1rem;
  padding: 4px;
  transition: var(--transition);
}
.auth-modal__password-toggle:hover {
  color: var(--primary-color);
}

.auth-modal__switch {
  margin-top: 20px;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-light);
}
.auth-modal__link {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
  padding: 0 4px;
}
.auth-modal__link:hover {
  color: var(--primary-dark);
}

</style>