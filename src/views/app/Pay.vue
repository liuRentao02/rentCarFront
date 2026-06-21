<template>
  <main class="payment-main">
    <div class="container">
      <el-card v-loading="loading" class="payment-card" shadow="never">
        <div v-if="order" class="payment-content">

          <!-- 订单金额模块 -->
          <div class="amount-section">
            <p class="amount-label">{{ isExtend ? '延长租期需支付' : '订单应付金额' }}</p>
            <div class="amount-value">
              <span class="currency">¥</span>
              <span class="number">{{ isExtend ? extendAmount : order.priceResult?.finalTotal }}</span>
            </div>
            <div class="order-meta" v-if="!isExtend">
              <span>订单编号：{{ order.orderNo }}</span>
              <span class="divider">|</span>
              <span>状态：{{ order.statusText }}</span>
            </div>
            <div class="order-meta" v-else>
              <span>原订单号：{{ order.orderNo }}</span>
              <span class="divider">|</span>
              <span>延长天数：{{ extendDays }} 天</span>
            </div>
            <div class="balance-info" v-if="userBalance !== null">
              <p>账户余额：¥{{ userBalance.toFixed(2) }}</p>
              <p v-if="userBalance < order.priceResult?.finalTotal" class="balance-warning">
                余额不足，请选择其他支付方式
              </p>
            </div>
          </div>

          <!-- 支付方式选择 -->
          <div class="payment-methods">
            <h3 class="section-title">选择支付方式</h3>
            <div class="method-grid">
              <div
                  v-for="method in paymentMethods"
                  :key="method.value"
                  class="method-card"
                  :class="{ 'is-active': selectedMethod === method.value }"
                  @click="selectedMethod = method.value"
              >
                <div class="card-content">
                  <span class="method-icon">{{ method.icon }}</span>
                  <span class="method-name">{{ method.label }}</span>
                </div>
                <div class="check-mark" v-if="selectedMethod === method.value">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作区域 -->
          <div class="action-area">
            <el-button type="primary" class="pay-btn" @click="handlePay" :loading="paying">
              <span v-if="!paying">确认支付</span>
              <span v-else>处理中...</span>
            </el-button>
            <el-button text class="back-btn" @click="router.back()">
              <el-icon><ArrowLeft /></el-icon> 返回上一页
            </el-button>
          </div>

          <!-- 安全提示 -->
          <div class="security-notice">
            <el-icon><Lock /></el-icon>
            <span>您的交易数据已通过SSL加密传输，安全有保障</span>
          </div>

        </div>
      </el-card>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Lock } from '@element-plus/icons-vue' // 引入图标
import { mainRequest } from '@/api'
import { useAppStore } from '@/stores/app'

const isExtend = ref(false);
const extendDays = ref(0);
const extendAmount = ref(0);


const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const orderId = route.params.id
const order = ref(null)
const loading = ref(false)
const paying = ref(false)

// 支付方式列表
const paymentMethods = [
  { value: 'wechat', label: '微信支付', icon: '💬' },
  { value: 'alipay', label: '支付宝', icon: '💰' },
  { value: 'bank', label: '银行卡支付', icon: '💳' },
  { value: 'balance', label: '余额支付', icon: '💰' },  // 新增
]
const selectedMethod = ref('wechat')
const userBalance = ref(0)
const fetchUserBalance = async () => {
  try {
    const userInfo = await mainRequest.get('/user', {
      params: { id: appStore.userInfo.id }
    })
    userBalance.value = userInfo.balance || 0
  } catch (error) {
    console.error('获取余额失败', error)
  }
}
// 检测是否为延长租期
if (route.query.type === 'extend') {
  isExtend.value = true;
  extendDays.value = parseInt(route.query.days) || 1;
  extendAmount.value = parseFloat(route.query.amount) || 0;
}
const fetchOrder = async () => {
  loading.value = true
  try {
    order.value = await mainRequest.get(`/orders/${orderId}`, {
      params: { userId: appStore.userInfo.id }
    })
    console.log(order.value)
  } catch (error) {
    ElMessage.error('获取订单信息失败')
    router.push('/profile/orders')
  } finally {
    loading.value = false
  }
}

const handlePay = async () => {
  if (!selectedMethod.value) {
    ElMessage.warning('请选择支付方式');
    return;
  }
  paying.value = true;
  try {
    if (isExtend.value) {
      // 调用延长租期支付接口
      await mainRequest.post(`/orders/${orderId}/extend/pay`, null, {
        params: {
          userId: appStore.userInfo.id,
          paymentMethod: selectedMethod.value,
          extraDays: extendDays.value
        }
      });
    } else {
      // 原订单支付
      await mainRequest.put(`/orders/${orderId}/pay`, null, {
        params: {
          userId: appStore.userInfo.id,
          paymentMethod: selectedMethod.value
        }
      });
    }
    // 支付成功跳转结果页
    console.log(order.value)
    router.push({
      path: '/payment-result',
      query: {
        id: order.value?.id || orderId,
        orderId: orderId,
        status: 'success',
        amount: isExtend.value ? extendAmount.value : order.value.priceResult?.finalTotal,
        method: selectedMethod.value,
        type: isExtend.value ? 'extend' : 'order'
      }
    });
  } catch (error) {
    router.push({
      path: '/payment-result',
      query: {
        id: order.value?.id || orderId,
        orderId: orderId,
        status: 'failed',
        message: error.response?.data?.message || '支付失败，请稍后重试',
        method: selectedMethod.value,
        type: isExtend.value ? 'extend' : 'order'
      }
    });
  } finally {
    paying.value = false;
  }
};

onMounted(() => {
  fetchOrder()
  fetchUserBalance()
})
</script>

<style scoped>
/* ========== 布局特有样式（保留） ========== */

.container {
  width: 90%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 15px;
  margin-top: 70px;
}

/* 头部区域 */
.page-header {
  margin-top: 70px;
  padding: 50px 0;
  background: linear-gradient(135deg, #2c3e50, #436fb3);
  color: var(--white);
  text-align: center;
  border-radius: 0 0 40px 40px;
}

.page-header__title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.page-header__breadcrumb {
  font-size: 0.9rem;
  opacity: 0.8;
}

.page-header__breadcrumb a {
  color: var(--white);
  text-decoration: none;
  transition: opacity 0.3s;
}

.page-header__breadcrumb a:hover {
  opacity: 0.6;
}

.separator {
  margin: 0 8px;
}

/* 主体区域 */
.payment-main {
  background-color: #f0f2f5;
  padding: 40px 0 80px;
  min-height: 60vh;
}

.payment-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.payment-card :deep(.el-card__body) {
  padding: 0;
}

.payment-content {
  padding: 40px;
}

/* 金额模块 */
.amount-section {
  text-align: center;
  padding: 30px 0;
  border-bottom: 1px dashed var(--border-color);
  margin-bottom: 30px;
}

.amount-label {
  font-size: 1rem;
  color: var(--text-light);
  margin-bottom: 10px;
}

.amount-value {
  color: #d0021b;
  margin-bottom: 15px;
}

.amount-value .currency {
  font-size: 1.5rem;
  font-weight: 600;
  margin-right: 4px;
  vertical-align: top;
}

.amount-value .number {
  font-size: 3.5rem;
  font-weight: 700;
  font-family: 'DIN Alternate', sans-serif;
}

.order-meta {
  font-size: 0.9rem;
  color: var(--text-light);
  background: var(--bg-light);
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
}

.divider {
  margin: 0 10px;
}

.balance-info {
  margin-top: 15px;
  font-size: 0.9rem;
}

.balance-warning {
  color: var(--error-color);
}

/* 支付方式模块 */
.section-title {
  font-size: 1.1rem;
  color: var(--text-dark);
  margin-bottom: 20px;
  font-weight: 600;
}

.method-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.method-card {
  position: relative;
  padding: 20px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fff;
}

.method-card:hover {
  border-color: #c0c4cc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.method-card.is-active {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.method-icon {
  font-size: 2rem;
}

.method-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-dark);
}

.check-mark {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background: var(--primary-color);
  color: white;
  border-radius: 0 10px 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 操作区域 */
.action-area {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.pay-btn {
  width: 100%;
  max-width: 320px;
  height: 54px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 27px;
  letter-spacing: 1px;
  background: linear-gradient(to right, #436fb3, #5b8bd4);
  border: none;
  box-shadow: 0 8px 16px rgba(67, 111, 179, 0.3);
  transition: all 0.3s;
}

.pay-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(67, 111, 179, 0.4);
}

.back-btn {
  color: var(--text-light);
  font-size: 0.9rem;
}

.back-btn:hover {
  color: var(--primary-color);
}

/* 安全提示 */
.security-notice {
  margin-top: 40px;
  text-align: center;
  color: #c0c4cc;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .page-header__title {
    font-size: 1.8rem;
  }

  .amount-value .number {
    font-size: 2.5rem;
  }

  .payment-content {
    padding: 20px;
  }

  .method-grid {
    grid-template-columns: 1fr;
  }

  .order-meta {
    display: block;
    line-height: 1.8;
  }

  .order-meta .divider {
    display: none;
  }
}
</style>
