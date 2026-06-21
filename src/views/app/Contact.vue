<template>
  <!-- ========== 主内容区域 ========== -->
  <main role="main">
    <!-- 联系内容区 -->
    <section class="contact-section" aria-label="联系方式">
      <div class="container">
        <div class="contact-grid">
          <!-- 联系信息 -->
          <aside class="contact-info" aria-label="联系信息">
            <h2 class="contact-info__title">联系方式</h2>
            <p class="contact-info__desc">
              您可以通过以下方式与我们取得联系，我们的客服团队将在24小时内回复您。
            </p>

            <ul class="contact-info__list">
              <li class="contact-info__item">
                <span class="contact-info__icon" aria-hidden="true">📍</span>
                <div class="contact-info__content">
                  <div class="contact-info__label">公司地址</div>
                  <address class="contact-info__value">
                    {{ appStore.appConfig.platformAddress }}
                  </address>
                </div>
              </li>
              <li class="contact-info__item">
                <span class="contact-info__icon" aria-hidden="true">📞</span>
                <div class="contact-info__content">
                  <div class="contact-info__label">服务热线</div>
                  <div class="contact-info__value">
                    <a href="tel:400-123-4567">
                      {{ appStore.appConfig.platformPhone }}
                    </a>
                  </div>
                </div>
              </li>
              <li class="contact-info__item">
                <span class="contact-info__icon" aria-hidden="true">✉️</span>
                <div class="contact-info__content">
                  <div class="contact-info__label">电子邮箱</div>
                  <div class="contact-info__value">
                    <a href="mailto:support@quickwheels.com">
                      {{ appStore.appConfig.platformEmail }}
                    </a>
                  </div>
                </div>
              </li>
              <li class="contact-info__item">
                <span class="contact-info__icon" aria-hidden="true">🕐</span>
                <div class="contact-info__content">
                  <div class="contact-info__label">工作时间</div>
                  <div class="contact-info__value">
                    {{ appStore.appConfig.platformWorkTime }}
                  </div>
                </div>
              </li>
            </ul>

            <!-- 社交媒体 -->
            <div class="contact-info__social">
              <div class="contact-info__social-title">{{ appStore.appConfig?.platformName }}</div>
              <div class="contact-info__social-links">
               <p>{{ appStore.appConfig?.platformText }}</p>
              </div>
            </div>
          </aside>

          <!-- 联系表单 -->
          <!-- 右侧留言表单 -->
          <div class="contact-form-wrapper">
            <h2 class="contact-form__title">在线留言</h2>
            <p class="contact-form__desc">请填写以下信息，我们会尽快与您联系</p>

            <form @submit.prevent="handleSubmit">
              <!-- 留言主题（可选） -->
              <div class="form-group">
                <label for="subject" class="form-group__label">留言主题</label>
                <select id="subject" v-model="form.subject" class="form-group__input">
                  <option value="">请选择留言主题</option>
                  <option value="inquiry">业务咨询</option>
                  <option value="booking">预订问题</option>
                  <option value="complaint">投诉建议</option>
                  <option value="cooperation">商务合作</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <!-- 留言内容（必填） -->
              <div class="form-group">
                <label for="message" class="form-group__label">留言内容 <span class="required">*</span></label>
                <textarea
                    id="message"
                    v-model="form.message"
                    class="form-group__textarea"
                    :class="{ 'form-group__textarea--error': errors.message }"
                    placeholder="请详细描述您的问题或建议..."

                    @blur="validateField('message')"
                    @input="clearError('message')"
                ></textarea>
                <span class="form-group__error" :class="{ 'form-group__error--visible': errors.message }">
                  {{ errors.message }}
                </span>
              </div>

              <button type="submit" class="form-submit" :disabled="isSubmitting">
                {{ isSubmitting ? '提交中...' : '提交留言' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  </main>
  <AuthModal v-model:visible="showLoginModal" :page="loginModalPage" @loginSuccess="onLoginSuccess" />
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAppStore } from "@/stores/app.js";
import AuthModal from "@/components/app/AuthModal.vue";
import { ElMessage } from 'element-plus';
import {mainRequest} from "@/api/index.js";

const appStore = useAppStore();
const showLoginModal = ref(false);
const loginModalPage = ref('login');

// 表单数据（只保留主题和内容）
const form = reactive({
  subject: '',
  message: '',
});

// 错误信息（只保留 message 的验证）
const errors = reactive({
  message: '',
});

const isSubmitting = ref(false);
const showSuccess = ref(false);

// 验证字段（只验证 message）
const validateField = (fieldName) => {
  const value = form[fieldName]?.trim() || '';
  let errorMsg = '';

  if (fieldName === 'message') {
    if (!value) errorMsg = '请输入留言内容';
    else if (value.length < 10) errorMsg = '留言内容至少需要10个字符';
  }

  errors[fieldName] = errorMsg;
  return !errorMsg;
};

const clearError = (fieldName) => {
  errors[fieldName] = '';
};

// 验证整个表单（只验证 message）
const validateForm = () => {
  return validateField('message');
};

// 提交留言
const handleSubmit = async () => {
  // 1. 检查登录状态
  if (!appStore.token) {
    ElMessage.warning('请先登录后再提交留言');
    showLoginModal.value = true;
    return;
  }

  // 2. 表单验证
  if (!validateForm()) {
    document.getElementById('message')?.focus();
    return;
  }

  isSubmitting.value = true;

  try {
    // 3. 调用后端接口，传递 userId 和留言内容
    const payload = {
      userId: appStore.userInfo.id,   // 从 store 获取登录用户ID
      subject: form.subject || '其他', // 若未选主题，默认“其他”
      message: form.message.trim()
    };
    // 假设后端接口为 /contact/submit
    await mainRequest.post('/contact/submit', payload);
    ElMessage.success('留言提交成功');
    showSuccess.value = true;
    // 清空表单
    form.subject = '';
    form.message = '';
  } catch (error) {
    ElMessage.error(error || '提交失败，请稍后重试');
  } finally {
    isSubmitting.value = false;
  }
};

// 登录成功后的回调
const onLoginSuccess = () => {
  ElMessage.success('登录成功，请继续提交留言');
};

// 重置成功提示（可选）
const resetForm = () => {
  showSuccess.value = false;
};
</script>
<style scoped>
/* ========== 布局特有样式（保留） ========== */

/* 页面标题区 - 如果模板中实际使用了 .page-header 则保留 */
.page-header {
  margin-top: 70px;
  padding: 60px 0;
  background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
  color: var(--white);
  text-align: center;
}

.page-header__title {
  font-size: 2.8rem;
  margin-bottom: 15px;
}

.page-header__subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
}

.page-header__breadcrumb {
  margin-top: 20px;
  font-size: 0.9rem;
  opacity: 0.8;
}

.page-header__breadcrumb a {
  color: var(--white);
  text-decoration: none;
}

.page-header__breadcrumb a:hover {
  text-decoration: underline;
}

/* 联系内容区 */
.contact-section {
  margin-top: 50px;
  padding: 80px 0;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
}

/* 左侧联系信息卡片（独特渐变背景） */
.contact-info {
  padding: 40px;
  background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
  border-radius: var(--radius);
  color: var(--white);
  box-shadow: var(--shadow-lg);
}

.contact-info__title {
  font-size: 1.8rem;
  margin-bottom: 15px;
}

.contact-info__desc {
  opacity: 0.9;
  margin-bottom: 30px;
  line-height: 1.7;
}

.contact-info__list {
  list-style: none;
}

.contact-info__item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 25px;
  padding-bottom: 25px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.contact-info__item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.contact-info__icon {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.contact-info__content {
  flex: 1;
}

.contact-info__label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 5px;
}

.contact-info__value {
  font-size: 1.1rem;
  font-weight: 600;
}

.contact-info__value a {
  color: var(--white);
  text-decoration: none;
  transition: var(--transition);
}

.contact-info__value a:hover {
  opacity: 0.8;
}

.contact-info__social {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.contact-info__social-title {
  font-size: 1rem;
  margin-bottom: 15px;
  opacity: 0.8;
}

.contact-info__social-links {
  display: flex;
  gap: 15px;
}

/* 右侧表单区域 */
.contact-form-wrapper {
  background: var(--white);
  border-radius: var(--radius);
  padding: 40px;
  box-shadow: var(--shadow-md);
}

.contact-form__title {
  font-size: 1.8rem;
  color: var(--primary-dark);
  margin-bottom: 10px;
}

.contact-form__desc {
  color: var(--text-light);
  margin-bottom: 30px;
}

/* 表单项布局 */
.form-group {
  margin-bottom: 25px;
}

.form-group__label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-dark);
}

.form-group__label .required {
  color: var(--error-color);
  margin-left: 3px;
}

/* 输入框和文本域的基础样式保留，但聚焦等全局已定义，此处只留布局相关 */
.form-group__input,
.form-group__textarea {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-family: inherit;
  transition: var(--transition);
  background: var(--white);
}

.form-group__textarea {
  min-height: 150px;
  resize: vertical;
}

/* 错误状态（全局可能未定义，保留） */
.form-group__input--error,
.form-group__textarea--error {
  border-color: var(--error-color);
}

.form-group__error {
  display: none;
  color: var(--error-color);
  font-size: 0.85rem;
  margin-top: 6px;
}

.form-group__error--visible {
  display: block;
}

/* 两列表单项布局（如果存在） */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* 提交按钮（全局已有样式，但此处保留位置/宽度布局，具体外观由全局定义） */
.form-submit {
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.form-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* 地图区域 */
.map-section {
  padding: 0 0 80px;
}

.map-section__title {
  text-align: center;
  font-size: 2rem;
  color: var(--primary-dark);
  margin-bottom: 30px;
}

.map-container {
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

.map-container__iframe {
  width: 100%;
  height: 400px;
  border: none;
  display: block;
}

.map-placeholder {
  width: 100%;
  height: 400px;
  background: linear-gradient(135deg, var(--primary-light), var(--bg-light));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
}

.map-placeholder__icon {
  font-size: 4rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

.map-placeholder__text {
  font-size: 1.1rem;
}

/* 成功提示（如果有） */
.success-message {
  display: none;
  text-align: center;
  padding: 40px;
}

.success-message--visible {
  display: block;
}

.success-message__icon {
  font-size: 4rem;
  color: var(--success-color);
  margin-bottom: 20px;
}

.success-message__title {
  font-size: 1.5rem;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.success-message__text {
  color: var(--text-light);
  margin-bottom: 20px;
}

.success-message__btn {
  padding: 12px 24px;
  background: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  cursor: pointer;
  transition: var(--transition);
}

.success-message__btn:hover {
  background: var(--primary-dark);
}

/* 调整普通输入框和下拉框的高度（如果有需要） */
.form-group__input,
.form-group__select {
  height: 60px;
  line-height: 44px;
  padding: 0 14px;
}

.form-group__textarea {
  min-height: 280px;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }

  .contact-info {
    order: 2;
  }

  .contact-form-wrapper {
    order: 1;
  }
}

@media (max-width: 768px) {
  .page-header__title {
    font-size: 2rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .contact-info,
  .contact-form-wrapper {
    padding: 25px;
  }

  .map-container__iframe,
  .map-placeholder {
    height: 300px;
  }
}
</style>