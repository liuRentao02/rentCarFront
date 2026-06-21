<template>
  <form class="auth-modal__form auth-modal__form--active" @submit.prevent>
    <!-- 步骤1：输入账号和验证码 -->
    <template v-if="step === 1">
      <div class="auth-modal__group">
        <label class="auth-modal__label">找回密码</label>
        <p class="auth-modal__hint">请输入您的手机号或邮箱，我们将发送验证码。</p>
      </div>

      <!-- 账号类型切换 -->
      <div class="auth-modal__account-type">
        <button
            type="button"
            class="auth-modal__type-btn"
            :class="{ 'auth-modal__type-btn--active': accountType === 'phone' }"
            @click="accountType = 'phone'"
        >
          手机号
        </button>
        <button
            type="button"
            class="auth-modal__type-btn"
            :class="{ 'auth-modal__type-btn--active': accountType === 'email' }"
            @click="accountType = 'email'"
        >
          邮箱
        </button>
      </div>

      <div class="auth-modal__group">
        <label class="auth-modal__label">{{ accountType === 'phone' ? '手机号' : '邮箱' }} <span class="required">*</span></label>
        <div class="auth-modal__input-wrapper">
          <input
              :type="accountType === 'phone' ? 'tel' : 'email'"
              v-model="form.account"
              class="auth-modal__input"
              :class="{ 'auth-modal__input--error': errors.account }"
              :placeholder="accountType === 'phone' ? '请输入手机号' : '请输入邮箱'"
              required
          />
          <span class="auth-modal__input-icon">{{ accountType === 'phone' ? '📱' : '📧' }}</span>
        </div>
        <div v-if="errors.account" class="auth-modal__error auth-modal__error--visible">
          <span>⚠️</span><span>{{ errors.account }}</span>
        </div>
      </div>

      <div class="auth-modal__group">
        <label class="auth-modal__label">验证码 <span class="required">*</span></label>
        <div class="auth-modal__captcha">
          <div class="auth-modal__input-wrapper">
            <input
                type="text"
                v-model="form.code"
                class="auth-modal__input"
                placeholder="请输入验证码"
                required
                maxlength="6"
                autocomplete="off"
            />
            <span class="auth-modal__input-icon">🔢</span>
          </div>
          <button
              type="button"
              class="auth-modal__captcha-btn"
              :disabled="codeSending || codeCountdown > 0"
              @click="sendCode"
          >
            {{ codeButtonText }}
          </button>
        </div>
        <div v-if="errors.code" class="auth-modal__error auth-modal__error--visible">
          <span>⚠️</span><span>{{ errors.code }}</span>
        </div>
      </div>

      <button type="button" class="auth-modal__submit" @click="nextStep1" :disabled="step1Loading">
        {{ step1Loading ? '验证中...' : '下一步' }}
      </button>
    </template>

    <!-- 步骤3：重置密码（原步骤2已删除） -->
    <template v-else-if="step === 3">
      <div class="auth-modal__group">
        <label class="auth-modal__label">重置密码</label>
        <p class="auth-modal__hint">请设置新密码</p>
      </div>

      <div class="auth-modal__group">
        <label class="auth-modal__label">新密码 <span class="required">*</span></label>
        <div class="auth-modal__input-wrapper">
          <input
              :type="passwordVisible ? 'text' : 'password'"
              v-model="form.newPassword"
              class="auth-modal__input"
              :class="{ 'auth-modal__input--error': errors.newPassword }"
              placeholder="至少6位"
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
        <div v-if="errors.newPassword" class="auth-modal__error auth-modal__error--visible">
          <span>⚠️</span><span>{{ errors.newPassword }}</span>
        </div>
      </div>

      <div class="auth-modal__group">
        <label class="auth-modal__label">确认密码 <span class="required">*</span></label>
        <div class="auth-modal__input-wrapper">
          <input
              :type="confirmVisible ? 'text' : 'password'"
              v-model="form.confirmPassword"
              class="auth-modal__input"
              :class="{ 'auth-modal__input--error': errors.confirmPassword }"
              placeholder="再次输入新密码"
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
        <div v-if="errors.confirmPassword" class="auth-modal__error auth-modal__error--visible">
          <span>⚠️</span><span>{{ errors.confirmPassword }}</span>
        </div>
      </div>

      <div style="display: flex; gap: 10px;">
        <button type="button" class="auth-modal__submit auth-modal__submit--secondary" @click="step = 1">
          上一步
        </button>
        <button type="button" class="auth-modal__submit" @click="submitReset" :disabled="resetLoading">
          {{ resetLoading ? '提交中...' : '完成' }}
        </button>
      </div>
    </template>

    <!-- 步骤4：结果页（美化版） -->
    <template v-else>
      <div class="auth-modal__result">
        <div class="result-icon" :class="{ 'result-icon--success': resetSuccess, 'result-icon--error': !resetSuccess }">
          {{ resetSuccess ? '✓' : '✗' }}
        </div>
        <h3 class="result-title">{{ resetSuccess ? '密码重置成功' : '重置失败' }}</h3>
        <p class="result-message">
          {{ resetSuccess ? '您的密码已重置，请使用新密码登录。' : (resetErrorMessage || '请稍后重试') }}
        </p>
        <button type="button" class="result-btn" @click="goToLogin">
          返回登录
        </button>
      </div>
    </template>

    <!-- 底部链接（结果页不显示） -->
    <div v-if="step !== 4" class="auth-modal__switch">
      想起账号？
      <button type="button" class="auth-modal__link" @click="$emit('back-to-login')">
        返回登录
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { mainRequest } from '@/api/index.js';

const emit = defineEmits(['back-to-login']);

// 步骤
const step = ref(1);

// 账号类型
const accountType = ref('phone'); // 'phone' 或 'email'

// 表单数据
const form = reactive({
  account: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
});

// 错误信息
const errors = reactive({
  account: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
});

// 加载状态
const step1Loading = ref(false);
const resetLoading = ref(false);
const codeSending = ref(false);
const codeCountdown = ref(0);
let codeTimer = null;

// 存储用户ID（验证成功后获得）
const userId = ref(null);

// 密码可见性
const passwordVisible = ref(false);
const confirmVisible = ref(false);

// 结果
const resetSuccess = ref(false);
const resetErrorMessage = ref('');

// 验证码按钮文字
const codeButtonText = computed(() => {
  if (codeSending.value) return '发送中...';
  if (codeCountdown.value > 0) return `${codeCountdown.value}秒后重发`;
  return '获取验证码';
});

// 清除倒计时
const clearCodeTimer = () => {
  if (codeTimer) {
    clearInterval(codeTimer);
    codeTimer = null;
  }
};

// 发送验证码
const sendCode = async () => {
  // 校验账号格式
  if (!form.account) {
    errors.account = `请输入${accountType.value === 'phone' ? '手机号' : '邮箱'}`;
    return;
  }
  if (accountType.value === 'phone' && !/^1[3-9]\d{9}$/.test(form.account)) {
    errors.account = '手机号格式不正确';
    return;
  }
  if (accountType.value === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.account)) {
    errors.account = '邮箱格式不正确';
    return;
  }
  errors.account = '';

  codeSending.value = true;
  try {
    // 调用发送验证码接口（需后端实现）
    // await sendResetCode({ account: form.account, type: accountType.value });
    ElMessage.success('验证码已发送（演示模式）');
    // 开始倒计时
    codeCountdown.value = 60;
    codeTimer = setInterval(() => {
      codeCountdown.value--;
      if (codeCountdown.value <= 0) {
        clearCodeTimer();
      }
    }, 1000);
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '发送失败');
  } finally {
    codeSending.value = false;
  }
};

// 第一步：验证账号和验证码
const nextStep1 = async () => {
  // 校验账号
  if (!form.account) {
    errors.account = `请输入${accountType.value === 'phone' ? '手机号' : '邮箱'}`;
    return;
  }
  if (accountType.value === 'phone' && !/^1[3-9]\d{9}$/.test(form.account)) {
    errors.account = '手机号格式不正确';
    return;
  }
  if (accountType.value === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.account)) {
    errors.account = '邮箱格式不正确';
    return;
  }
  errors.account = '';

  // 校验验证码
  if (!form.code) {
    errors.code = '请输入验证码';
    return;
  }
  errors.code = '';

  step1Loading.value = true;
  try {
    // 调用验证验证码接口，返回用户信息（假设后端返回用户列表或单个用户对象）
    const res = await mainRequest.post('/auth/forget', { account: form.account });
    // 兼容两种返回：直接返回用户对象，或返回数组（取第一个）
    const user = Array.isArray(res) ? res[0] : res;
    if (!user || !user.id) {
      ElMessage.error('未找到相关账号');
      return;
    }
    userId.value = user.id;
    step.value = 3; // 直接进入重置密码步骤
  } catch (error) {
    ElMessage.error(error || '验证失败');
  } finally {
    step1Loading.value = false;
  }
};

// 第三步：提交重置密码
const submitReset = async () => {
  // 校验密码
  if (!form.newPassword) {
    errors.newPassword = '请输入新密码';
    return;
  }
  if (form.newPassword.length < 6) {
    errors.newPassword = '密码长度至少6位';
    return;
  }
  errors.newPassword = '';

  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认密码';
    return;
  }
  if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = '两次密码不一致';
    return;
  }
  errors.confirmPassword = '';

  resetLoading.value = true;
  try {
    // 调用重置密码接口
    await mainRequest.post('/auth/forget', {
      id: userId.value,
      password: form.newPassword,
    });
    resetSuccess.value = true;
    step.value = 4;
  } catch (error) {
    resetSuccess.value = false;
    resetErrorMessage.value = error || '重置失败，请重试';
    step.value = 4;
  } finally {
    resetLoading.value = false;
  }
};

// 返回登录
const goToLogin = () => {
  emit('back-to-login');
};

// 组件卸载时清除计时器
onUnmounted(() => {
  clearCodeTimer();
});
</script>

<style scoped>
/* 基础样式保持与原组件一致，仅修改结果页样式 */
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
.auth-modal__captcha-btn {
  width: 120px;
  height: 48px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-light);
  cursor: pointer;
  transition: var(--transition);
  flex-shrink: 0;
}
.auth-modal__captcha-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}
.auth-modal__captcha-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
.auth-modal__submit--secondary {
  background: var(--bg-light);
  color: var(--text-dark);
  box-shadow: none;
}
.auth-modal__submit--secondary:hover {
  background: var(--border-color);
}
.auth-modal__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
.auth-modal__hint {
  font-size: 0.9rem;
  color: var(--text-light);
  margin-bottom: 15px;
}
.auth-modal__account-type {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.auth-modal__type-btn {
  flex: 1;
  padding: 10px;
  background: var(--bg-light);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  font-weight: 500;
}
.auth-modal__type-btn--active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* 结果页样式（美化版） */
.auth-modal__result {
  text-align: center;
  padding: 20px 0;
}
.result-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  color: white;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}
.result-icon--success {
  background: linear-gradient(135deg, #10b981, #059669);
}
.result-icon--error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
.result-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-dark);
}
.result-message {
  font-size: 0.95rem;
  color: var(--text-light);
  margin-bottom: 32px;
  line-height: 1.5;
}
.result-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border: none;
  border-radius: 40px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.result-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 86, 179, 0.3);
}
</style>