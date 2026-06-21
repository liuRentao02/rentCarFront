<template>
  <main class="result-main">
    <div class="container">
      <!-- 动态添加状态类名 -->
      <el-card class="result-card" :class="isSuccess ? 'is-success' : 'is-failed'" shadow="never">

        <!-- 顶部装饰条 -->
        <div class="card-deco"></div>

        <div class="result-content">
          <!-- 图标区域：包含SVG动画 -->
          <div class="icon-wrapper">
            <div v-if="isSuccess" class="icon-box success">
              <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <div v-else class="icon-box failed">
              <svg class="crossmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle class="crossmark__circle" cx="26" cy="26" r="25" fill="none"/>
                <path class="crossmark__cross" fill="none" d="M16 16 36 36 M36 16 16 36"/>
              </svg>
            </div>
          </div>

          <!-- 文本信息 -->
          <h2 class="result-title">{{ isSuccess ? '支付成功' : '支付失败' }}</h2>
          <p class="result-desc">
            {{ isSuccess ? '您的订单已支付成功，感谢您的使用！' : (errorMessage || '支付过程中出现异常，请稍后重试。') }}
          </p>

          <!-- 订单详情卡片（收据样式） -->
          <div class="receipt-box" v-if="orderId">
            <div class="receipt-item">
              <span class="label">订单编号</span>
              <span class="value">{{ orderId }}</span>
            </div>
            <div class="receipt-item">
              <span class="label">支付金额</span>
              <span class="value highlight">¥{{ amount }}</span>
            </div>
            <div class="receipt-item">
              <span class="label">支付方式</span>
              <span class="value">{{ paymentMethodName }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="result-actions">
            <el-button type="primary" class="action-btn primary-action" @click="goToOrderDetail">
              查看订单详情
            </el-button>
            <el-button class="action-btn" @click="goToHome">
              返回首页
            </el-button>
            <el-button
                v-if="!isSuccess"
                class="action-btn retry-action"
                @click="retryPayment"
            >
              重新支付
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const orderId = route.query.orderId
const id = route.query.id
const status = route.query.status
const amount = route.query.amount || '0.00'
const method = route.query.method
const errorMessage = route.query.message

const isSuccess = computed(() => status === 'success')

const paymentMethodName = computed(() => {
  const map = {
    wechat: '微信支付',
    alipay: '支付宝',
    bank: '银行卡支付'
  }
  return map[method] || method || '在线支付'
})

const goToOrderDetail = () => {
  if (orderId) {
    router.push(`/order/${id}`)
  } else {
    router.push('/profile/orders')
  }
}

const goToHome = () => {
  router.push('/')
}

const retryPayment = () => {
  if (orderId) {
    router.push(`/pay/${orderId}`)
  } else {
    router.push('/profile/orders')
  }
}
</script>

<style scoped>
/* ========== 布局特有样式（保留） ========== */

/* 主体背景（区别于全局） */
.result-main {
  background-color: #f5f7fa;
  padding: 50px 0 80px;
  min-height: 60vh;
}

/* 结果卡片（特有边框和装饰条） */
.result-card {
  position: relative;
  border-radius: 16px;
  border: none;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  margin-top: 70px;
}

/* 顶部装饰条（根据成功/失败变色） */
.card-deco {
  height: 4px;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background: #dcdfe6;
}

.result-card.is-success .card-deco {
  background: linear-gradient(90deg, #19be6b, #2d8cf0);
}

.result-card.is-failed .card-deco {
  background: linear-gradient(90deg, #ed4014, #ff9900);
}

.result-content {
  padding: 50px 40px;
}

/* 图标动画区域 */
.icon-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.icon-box {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* SVG 通用动画 */
svg {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  stroke-width: 2;
  stroke: #fff;
  stroke-miterlimit: 10;
  box-shadow: inset 0px 0px 0px #fff;
  animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
}

/* 成功动画 */
.checkmark__circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: #19be6b;
  fill: none;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark__check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  stroke: #19be6b;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

/* 失败动画 */
.crossmark__circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: #ed4014;
  fill: none;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.crossmark__cross {
  transform-origin: 50% 50%;
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
  stroke: #ed4014;
  stroke-width: 3;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes stroke {
  100% { stroke-dashoffset: 0; }
}

@keyframes scale {
  0%, 100% { transform: none; }
  50% { transform: scale3d(1.1, 1.1, 1); }
}

/* 文本区域 */
.result-title {
  font-size: 1.8rem;
  text-align: center;
  margin-bottom: 12px;
  color: #303133;
  font-weight: 600;
}

.result-desc {
  text-align: center;
  font-size: 0.95rem;
  color: #909399;
  margin-bottom: 32px;
  line-height: 1.6;
}

/* 收据信息（卡片样式） */
.receipt-box {
  background: #f9fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 35px;
  border: 1px solid #ebeef5;
}

.receipt-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed #e4e7ed;
}

.receipt-item:last-child {
  border-bottom: none;
}

.receipt-item .label {
  color: #909399;
  font-size: 0.9rem;
}

.receipt-item .value {
  color: #303133;
  font-weight: 500;
  font-size: 0.95rem;
}

.receipt-item .value.highlight {
  color: #ed4014;
  font-size: 1.1rem;
  font-weight: 700;
}

/* 按钮区域（只保留布局，具体样式由全局控制） */
.result-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.action-btn {
  width: 100%;
  height: 44px;
  font-size: 1rem;
  border-radius: 22px;
  margin: 0;
}

/* 主要操作按钮（重写部分背景色，因为全局可能没有这个类） */
.primary-action {
  background: #436fb3;
  border-color: #436fb3;
  color: white;
}

.primary-action:hover {
  background: #5b8bd4;
  border-color: #5b8bd4;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(67, 111, 179, 0.3);
}

.retry-action {
  background: #19be6b;
  border-color: #19be6b;
  color: white;
}

.retry-action:hover {
  background: #47d487;
  border-color: #47d487;
}
</style>
