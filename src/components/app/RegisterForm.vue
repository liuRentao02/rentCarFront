<template>
  <div class="auth-modal__form auth-modal__form--active">
    <form @submit.prevent="handleRegister">
      <!-- 账号类型切换 -->
      <div class="auth-modal__register-tabs">
        <button
            type="button"
            class="auth-modal__register-tab"
            :class="{ 'auth-modal__register-tab--active': registerType === 'phone' }"
            @click="registerType = 'phone'"
        >
          手机号
        </button>
        <button
            type="button"
            class="auth-modal__register-tab"
            :class="{ 'auth-modal__register-tab--active': registerType === 'email' }"
            @click="registerType = 'email'"
        >
          邮箱
        </button>
      </div>

      <!-- 账号输入 -->
      <div class="auth-modal__group">
        <label class="auth-modal__label"
        >{{ registerType === 'phone' ? '手机号' : '邮箱' }} <span class="required">*</span></label
        >
        <div class="auth-modal__input-wrapper">
          <input
              :type="registerType === 'email' ? 'email' : 'tel'"
              v-model="form.account"
              class="auth-modal__input"
              :class="{ 'auth-modal__input--error': errors.account }"
              :placeholder="registerType === 'phone' ? '请输入手机号' : '请输入邮箱'"
              required
              autocomplete="off"
          />
          <span class="auth-modal__input-icon">{{ registerType === 'phone' ? '📱' : '📧' }}</span>
        </div>
        <div v-if="errors.account" class="auth-modal__error auth-modal__error--visible">
          <span>⚠️</span><span>{{ errors.account }}</span>
        </div>
      </div>

      <!-- 图形验证码 -->
      <div class="auth-modal__group">
        <label class="auth-modal__label">验证码 <span class="required">*</span></label>
        <div class="auth-modal__captcha">
          <div class="auth-modal__input-wrapper">
            <input
                type="text"
                v-model="form.captcha"
                class="auth-modal__input"
                :class="{ 'auth-modal__input--error': errors.captcha }"
                placeholder="请输入验证码"
                required
                maxlength="4"
                autocomplete="off"
            />
            <span class="auth-modal__input-icon">🔢</span>
          </div>
          <div class="auth-modal__captcha-img" @click="refreshCaptcha">
            <el-image :src="captchaImg" />
          </div>
        </div>
        <div v-if="errors.captcha" class="auth-modal__error auth-modal__error--visible">
          <span>⚠️</span><span>{{ errors.captcha }}</span>
        </div>
      </div>

      <!-- 密码 -->
      <div class="auth-modal__group">
        <label class="auth-modal__label">密码 <span class="required">*</span></label>
        <div class="auth-modal__input-wrapper">
          <input
              :type="passwordVisible ? 'text' : 'password'"
              v-model="form.password"
              class="auth-modal__input"
              :class="{ 'auth-modal__input--error': errors.password }"
              placeholder="请设置密码（至少6位）"
              required
              autocomplete="new-password"
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
        <div v-if="errors.password" class="auth-modal__error auth-modal__error--visible">
          <span>⚠️</span><span>{{ errors.password }}</span>
        </div>
      </div>

      <!-- 确认密码 -->
      <div class="auth-modal__group">
        <label class="auth-modal__label">确认密码 <span class="required">*</span></label>
        <div class="auth-modal__input-wrapper">
          <input
              :type="confirmVisible ? 'text' : 'password'"
              v-model="form.confirm"
              class="auth-modal__input"
              :class="{ 'auth-modal__input--error': errors.confirm }"
              placeholder="请再次输入密码"
              required
              autocomplete="new-password"
          />
          <span class="auth-modal__input-icon">🔐</span>
          <button
              type="button"
              class="auth-modal__password-toggle"
              @click="confirmVisible = !confirmVisible"
          >
            {{ confirmVisible ? '🙈' : '👁️' }}
          </button>
        </div>
        <div v-if="errors.confirm" class="auth-modal__error auth-modal__error--visible">
          <span>⚠️</span><span>{{ errors.confirm }}</span>
        </div>
      </div>

      <!-- 提交按钮 -->
      <button type="submit" class="auth-modal__submit" :disabled="loading">
        {{ loading ? '注册中...' : '立即注册' }}
      </button>

      <!-- 已有账号链接 -->
      <div class="auth-modal__switch">
        已有账号？
        <button type="button" class="auth-modal__link" @click="$emit('switch-to-login')">
          立即登录
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { mainRequest } from '@/api/index.js';

const emit = defineEmits(['registerSuccess', 'switch-to-login']);

const registerType = ref('phone'); // phone 或 email

const form = reactive({
  account: '',
  captcha: '',
  password: '',
  confirm: '',
});

const errors = reactive({
  account: '',
  captcha: '',
  password: '',
  confirm: '',
});

const loading = ref(false);
const passwordVisible = ref(false);
const confirmVisible = ref(false);

// 图形验证码
const captchaText = ref('');
const captchaImg = ref('');
const isRefreshingCaptcha = ref(false); // 防止重复刷新

// 刷新验证码
const refreshCaptcha = async () => {
  // 防止重复调用
  if (isRefreshingCaptcha.value) return;

  isRefreshingCaptcha.value = true;
  try {
    const res = await mainRequest({
      url: '/auth/captcha',
      method: 'get',
      params: {
        w: 180,
        h: 60,
        s: 4
      }
    });
    captchaImg.value = res.image;
    captchaText.value = res.code;
  } catch (error) {
    console.error('刷新验证码失败', error);
    ElMessage.error('刷新验证码失败，请重试');
  } finally {
    isRefreshingCaptcha.value = false;
  }
};

// 表单整体校验
const validateForm = () => {
  let valid = true;
  const account = form.account.trim();

  // 账号校验
  if (!account) {
    errors.account = `请输入${registerType.value === 'phone' ? '手机号' : '邮箱'}`;
    valid = false;
  } else {
    if (registerType.value === 'phone') {
      if (!/^1[3-9]\d{9}$/.test(account)) {
        errors.account = '手机号格式不正确';
        valid = false;
      } else {
        errors.account = '';
      }
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)) {
        errors.account = '邮箱格式不正确';
        valid = false;
      } else {
        errors.account = '';
      }
    }
  }

  // 验证码校验（不区分大小写）
  if (!form.captcha) {
    errors.captcha = '请输入验证码';
    valid = false;
  } else if (form.captcha.toLowerCase() !== captchaText.value.toLowerCase()) {
    errors.captcha = '验证码错误';
    valid = false;
  } else {
    errors.captcha = '';
  }

  // 密码校验
  if (!form.password) {
    errors.password = '请输入密码';
    valid = false;
  } else if (form.password.length < 6) {
    errors.password = '密码长度至少6位';
    valid = false;
  } else {
    errors.password = '';
  }

  // 确认密码校验
  if (!form.confirm) {
    errors.confirm = '请再次输入密码';
    valid = false;
  } else if (form.password !== form.confirm) {
    errors.confirm = '两次输入的密码不一致';
    valid = false;
  } else {
    errors.confirm = '';
  }

  return valid;
};

// 提交注册
const handleRegister = async () => {
  if (!validateForm()) {
    // 当验证码错误且有输入内容时，自动刷新验证码并清空输入
    if (errors.captcha && form.captcha.trim() !== '') {
      // 更新错误提示，告知用户验证码已刷新
      errors.captcha = '验证码错误，请重新输入';
      // 清空验证码输入框
      form.captcha = '';
      // 刷新验证码图片
      await refreshCaptcha();
      // 可额外提示用户
      ElMessage.warning('验证码错误，请重新输入');
    }
    return;
  }

  loading.value = true;
  try {
    await mainRequest({
      url: '/auth/register',
      method: 'post',
      data: {
        [registerType.value]: form.account.trim(),
        password: form.password,
      }
    });
    ElMessage.success('注册成功，请登录');
    // 通知父组件切换到登录表单
    emit('registerSuccess');
    // 延迟一下再切换，避免动画冲突
    setTimeout(() => {
      emit('switch-to-login');
    }, 500);
  } catch (error) {
    ElMessage.error(error?.message || '注册失败，请稍后重试');
    // 注册失败时也刷新验证码
    await refreshCaptcha();
    // 清空验证码输入框，让用户重新输入
    form.captcha = '';
  } finally {
    loading.value = false;
  }
};

// 初始化加载验证码
onMounted(() => {
  refreshCaptcha();
});
</script>

<style scoped>
/* 样式复用原有的 RegisterForm 样式（保持不变） */
.auth-modal__register-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.auth-modal__register-tab {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-light);
  cursor: pointer;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  transition: var(--transition);
}
.auth-modal__register-tab--active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
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
.auth-modal__input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(0, 86, 179, 0.1);
}
.auth-modal__input--error {
  border-color: var(--error-color);
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
  width: 120px;
  height: 48px;
  border-radius: var(--radius-sm);
  background: var(--bg-light);
  border: 1px solid var(--border-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  flex-shrink: 0;
  overflow: hidden;
}
.auth-modal__captcha-img:hover {
  border-color: var(--primary-color);
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
  cursor: pointer;
  transition: var(--transition);
}
.auth-modal__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.auth-modal__submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 86, 179, 0.35);
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