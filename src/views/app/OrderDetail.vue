<template>
  <main role="main">
    <div class="container">
      <div class="order-detail" v-loading="loading">
        <!-- 订单状态和订单号 -->
        <div class="order-header">
          <div class="order-no">
            订单号：{{ order.orderNo }}
          </div>
          <div class="order-time">
            下单时间：{{ formatDateTime(order.createTime) }}
          </div>
          <div class="order-status">
            <span class="status-badge" :class="StatusColor(order.statusText)">{{ order.statusText }}</span>
          </div>
        </div>

        <!-- 车辆信息摘要 -->
        <div class="section">
          <h3 class="section-title">车辆信息</h3>
          <div class="car-summary">
            <img :src="order.carImage" :alt="order.carName" class="car-image" loading="lazy"/>
            <div class="car-info">
              <div class="car-name">{{ order.carName }}</div>
              <div class="car-price">¥{{ order.dailyRent }}/天</div>
            </div>
          </div>
        </div>

        <!-- 行程信息 -->
        <div class="section">
          <h3 class="section-title">行程信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">取车地点：</span>
              <span class="value">{{ order.pickupLocation }}</span>
            </div>
            <div class="info-item">
              <span class="label">还车地点：</span>
              <span class="value">{{ order.returnLocation }}</span>
            </div>
            <div class="info-item">
              <span class="label">取车时间：</span>
              <span class="value">{{ formatDateTime(order.rentStartTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">还车时间：</span>
              <span class="value">{{ formatDateTime(order.rentEndTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">租用天数：</span>
              <span class="value">{{ order.totalDays }} 天</span>
            </div>
          </div>
        </div>

        <!-- 增值服务 -->
        <div class="section" v-if="order.services && order.services.length">
          <h3 class="section-title">增值服务</h3>
          <div class="service-list">
            <div v-for="service in order.services" :key="service.id" class="service-item">
              <span class="service-name">{{ service.serviceNameSnapshot }}</span>
              <span class="service-price">¥{{ service.priceSnapshot }} /天</span>
            </div>
          </div>
        </div>

        <!-- 联系人信息 -->
        <div class="section">
          <h3 class="section-title">联系人信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">姓名：</span>
              <span class="value">{{ order.contactName }}</span>
            </div>
            <div class="info-item">
              <span class="label">手机号：</span>
              <span class="value">{{ order.contactPhone }}</span>
            </div>
            <div class="info-item">
              <span class="label">邮箱：</span>
              <span class="value">{{ order.contactEmail }}</span>
            </div>
          </div>
        </div>

        <!-- 费用明细 -->
        <div class="section">
          <h3 class="section-title">费用明细</h3>
          <div class="price-summary">
            <!-- 费用项（正数） -->
            <div v-for="fee in order.priceResult?.feeItems" :key="fee.key" class="price-item">
              <span class="label">{{ fee.description }}</span>
              <span class="value">¥{{ fee.amount }}</span>
            </div>

            <!-- 原价小计 -->
            <div class="price-item total">
              <span class="label">小计</span>
              <span class="value">¥{{ order.priceResult?.originalTotal || 0 }}</span>
            </div>

            <!-- 优惠项（负数，绿色） -->
            <div
                v-for="discount in order.priceResult?.discountItems"
                :key="discount.key"
                class="price-item discount"
            >
                <span class="label" v-if="discount.amount !== 0">{{ discount.description }}</span>
                <span class="value" v-if="discount.amount !== 0">-¥{{ discount.amount }}</span>
            </div>

            <!-- 押金原价（如果未包含在 feeItems 中，且需要单独显示） -->
            <!-- 这里保留押金原价行，因为押金状态、退还等业务信息仍需展示 -->
<!--            &lt;!&ndash; 押金退还（仅当有退还时显示） &ndash;&gt;-->
            <div v-if="order.depositRefundAmount && order.depositRefundAmount > 0" class="price-item refund">
              <span class="label">退还押金</span>
              <span class="value">+¥{{ order.depositRefundAmount }}</span>
            </div>

<!--            &lt;!&ndash; 押金状态 &ndash;&gt;-->
            <div class="price-item" v-if="order.depositStatus">
              <span class="label">押金状态</span>
              <span class="value" :style="{ color: depositStatusColor(order.depositStatus) }">
                  {{ order.depositStatus }}
              </span>
            </div>

            <!-- 罚金（保留原逻辑） -->
            <div v-if="order.penaltyAmount && order.penaltyAmount > 0" class="price-item penalty">
              <span class="label">罚金</span>
              <span class="value">¥{{ order.penaltyAmount }}</span>
            </div>
            <div v-if="order.penaltyReason" class="price-item penalty-reason">
              <span class="label">罚金原因</span>
              <span class="value">{{ order.penaltyReason }}</span>
            </div>

            <!-- 应付总额（基于 priceResult.finalTotal） -->
            <div class="price-item grand-total">
              <span class="label">应付总额</span>
              <span class="value">¥{{ order.priceResult?.finalTotal || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="actions"
             v-if="order.canCancel || order.canPay || order.canApplyPickup || order.canApplyReturn || !order.reviewed">
          <el-button class="button-end" v-if="order.canCancel" @click="cancelOrder">取消订单</el-button>
          <el-button class="button-end" v-if="order.canPay" @click="goToPay">立即支付</el-button>
          <el-button class="button-end" v-if="order.statusText === '租赁中' && order.extension !== 0" @click="openExtendDialog">延长租期</el-button>
          <el-button class="button-end" v-if="order.canApplyReturn" @click="applyReturn">申请还车</el-button>
          <el-button class="button-end" v-if="canReview" type="success" @click="goToReview">发表评论</el-button>
        </div>
      </div>
    </div>

    <!-- 延长租期对话框（简化版） -->
    <el-dialog v-model="extendDialogVisible" title="延长租期" width="400px" center>
      <div style="padding: 20px;">
        <el-form :model="extendForm" label-width="100px">
          <el-form-item label="延长天数">
            <el-input-number v-model="extendForm.extraDays" :min="1" :max="30" controls-position="right" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="预估费用">
            <span style="color: var(--el-color-danger); font-weight: 600; font-size: 1.2rem;">¥{{ extendCost }}</span>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="extendDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="goToExtendPay" :loading="extending">确认支付</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<script setup>
import {computed, onMounted, reactive, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {mainRequest} from '@/api/index.js'
import {useAppStore} from "@/stores/app.js";

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()
// 延长租期相关
const extendDialogVisible = ref(false);
const extending = ref(false);
const extendForm = reactive({ extraDays: 1 });
const extendCost = ref(0);
let currentOrderId = null;


const order = ref({})
const loading = ref(false)
const goToPay = () => {
  router.push(`/pay/${order.value.id}`)
}
const fetchOrderDetail = async () => {
  const id = route.params.id
  if (!id) return
  loading.value = true
  try {
    order.value = await mainRequest.get(`/orders/${id}`, {
      params: {
        'userId': appStore.userInfo.id
      }
    })
  } catch (error) {
    ElMessage.error(error || '获取订单详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}
// 打开对话框并获取预估费用
const openExtendDialog = async () => {
  currentOrderId = order.value.id;
  extendForm.extraDays = 1;
  extendDialogVisible.value = true;
  await fetchExtendCost();
};
// 获取预估费用
const fetchExtendCost = async () => {
  if (!currentOrderId) return;
  try {
    extendCost.value = await mainRequest.get(`/orders/${currentOrderId}/extend/estimate`, {
      params: {extraDays: extendForm.extraDays}
    });
  } catch (error) {
    ElMessage.error(error || '获取费用失败');
    extendDialogVisible.value = false;
  }
};
// 跳转到支付页面（延长租期）
const goToExtendPay = async () => {
  if (extendForm.extraDays < 1) {
    ElMessage.warning('请输入有效的天数');
    return;
  }
  extending.value = true;
  try {
    // 先获取预估费用（可选，也可直接跳转）
    await fetchExtendCost();
    // 跳转到支付页面，带上订单ID和延长天数
    await router.push({
      path: `/pay/${currentOrderId}`,
      query: {
        type: 'extend',
        days: extendForm.extraDays,
        amount: extendCost.value
      }
    });
    extendDialogVisible.value = false;
  } catch (error) {
    ElMessage.error('获取费用失败');
  } finally {
    extending.value = false;
  }
};
// 是否可评论
const canReview = computed(() => {
  console.log(order.value?.statusText === '已完成' && !order.value?.reviewed)
  return order.value?.statusText === '已完成' && !order.value?.reviewed
})

// 跳转评论页
const goToReview = () => {
  router.push(`/review/${order.value.id}`)
}

const depositStatusColor = (status) => {
  const map = {'已支付': 'var(--success-color)', '已退还': 'var(--primary-color)', '待支付': 'var(--warning-color)'};
  return map[status] || 'var(--text-light)';
};

const StatusColor = (status) => {
  const map = {'已支付': 'status-completed', '已完成':'status-cancelled', "异常":'status-cancelled'};
  return map[status] || 'status-completed';
};
const applyReturn = async () => {
  try {
    await ElMessageBox.confirm('确认申请还车吗？工作人员将尽快处理您的请求。', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    });
    await mainRequest.put(`/orders/${order.value.id}/applyReturn`, null, {
      params: {
        userId: appStore.userInfo.id
      }
    });
    ElMessage.success('还车申请已提交');
    fetchOrderDetail();
  } catch (error) {
      ElMessage.error(error || '申请失败');
  }
};
const formatDateTime = (datetime) => {
  if (!datetime) return ''
  const date = new Date(datetime)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`
}

const cancelOrder = async () => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await mainRequest.put(`/orders/${order.value.id}/cancel`, null, {
      params: {userId: appStore.userInfo.id}
    });
    ElMessage.success('订单已取消');
    await fetchOrderDetail();
  } catch (error) {
    ElMessage.error(error||'取消订单失败');
  }
};
// 监听天数变化重新计算费用
watch(() => extendForm.extraDays, () => {
  if (extendForm.extraDays >= 1) {
    fetchExtendCost();
  }
});
onMounted(() => {
  fetchOrderDetail()
})
</script>

<style scoped>
.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 70px;
  padding: 0 15px;
}
.page-header {
  margin-top: 70px;
  padding: 40px 0;
  background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
  color: var(--white);
}
.page-header__title {
  font-size: 2rem;
  margin-bottom: 5px;
}
.page-header__breadcrumb {
  font-size: 0.9rem;
  opacity: 0.8;
}
.price-item.penalty .value {
  color: var(--error-color);
}
.price-item.penalty-reason {
  font-size: 0.9rem;
  color: var(--text-light);
  border-top: none;
  margin-top: -8px;
  margin-bottom: 12px;
}
.page-header__breadcrumb a {
  color: var(--white);
  text-decoration: none;
}
.page-header__breadcrumb a:hover {
  text-decoration: underline;
}
.price-item.refund .value {
  color: var(--success-color);
}
.order-detail {
  padding: 40px 0;
}
.price-item.penalty .value {
  color: var(--error-color);
}
.section {
  background: var(--white);
  border-radius: var(--radius);
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-sm);
}
.section-title {
  font-size: 1.3rem;
  color: var(--primary-dark);
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--border-color);
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  background: var(--bg-light);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 20px;
}

.car-summary {
  display: flex;
  gap: 20px;
}
.car-image {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background-color: #eee;
}
.car-info {
  flex: 1;
}
.car-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-dark);
}
.car-details {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 8px;
  color: var(--text-light);
  font-size: 0.9rem;
}
.car-price {
  font-weight: 700;
  color: var(--primary-color);
  font-size: 1.2rem;
  margin-top: 10px;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px 30px;
}
.info-item {
  display: flex;
  line-height: 1.6;
}
.info-item .label {
  font-weight: 600;
  color: var(--text-dark);
  min-width: 100px;
}
.info-item .value {
  color: var(--text-light);
}
.service-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.service-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed var(--border-color);
}
.service-item:last-child {
  border-bottom: none;
}
.price-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.price-item {
  display: flex;
  justify-content: space-between;
  color: var(--text-dark);
}
.price-item.total {
  font-weight: 700;
  color: var(--primary-color);
}
.price-item.discount {
  color: var(--success-color);
}
.price-item.grand-total {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary-color);
  border-top: 2px solid var(--border-color);
  padding-top: 10px;
  margin-top: 10px;
}
.actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  flex-wrap: wrap;
  text-align: right;
}
.button-end {
  width: 40%;
  height: 80px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--primary-color);
  color: var(--white);
  border-radius: var(--radius);
  font-size: 1.2rem;
}

.status-badge {
  padding: 8px 24px;
  border-radius: 30px;
  font-size: 1.2rem;
  font-weight: 600;
  display: inline-block;
  line-height: 1.2;
}
.status-badge.status-completed {
  color: #109843;
}
.status-badge.status-upcoming {
  color: #ba8c06;
}
.status-badge.status-cancelled {
  color: #aa0615;
}
</style>