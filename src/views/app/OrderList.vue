<template>
  <section class="page-header" aria-label="页面标题">
  </section>

  <main role="main">
    <div class="container">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-select v-model="statusFilter" placeholder="全部状态" clearable @change="handleFilterChange">
          <el-option
              v-for="item in ORDER_STATUS_FILTERS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
          />
        </el-select>
      </div>

      <!-- 订单列表 -->
      <div class="order-list" v-loading="loading">
        <div v-if="orders.length === 0" class="empty-state">
          <el-empty description="暂无订单" :image-size="200" />
        </div>
        <div v-else>
          <div v-for="order in orders" :key="order.id" class="order-card">
            <div class="order-card__left">
              <img :src="order.carImage" :alt="order.carName" class="order-card__image" />
            </div>
            <div class="order-card__center">
              <div class="order-card__car">{{ order.carName }}</div>
              <div class="order-card__info">
                <span>订单号：{{ order.orderNo }}</span>
                <span>租期：{{ formatDate(order.rentStartTime) }} ~ {{ formatDate(order.rentEndTime) }}</span>
                <span>共 {{ order.totalDays }} 天</span>
              </div>
            </div>
            <div class="order-card__right">
              <div class="order-card__price">¥{{ order.totalAmount }}</div>
              <div class="order-card__status" :class="StatusColor(order.statusText)">
                {{ order.statusText }}
              </div>
              <el-button type="primary" size="small" @click="viewDetail(order.id)">查看详情</el-button>
            </div>
          </div>

          <!-- 分页 -->
          <el-pagination
              size="large"
              style="display: flex;justify-content: center"
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[5, 10, 20, 50]"
              layout="prev, pager, next, sizes, jumper"
              background
              @current-change="fetchOrders"
              @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { mainRequest } from '@/api'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

const orders = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const statusFilter = ref('')
// 在你的常量文件里定义
const ORDER_STATUS_FILTERS = [
  { label: '待支付', value: '待支付' },
  { label: '待取车', value: '待取车' }, // 前端文案和后端值解耦
  { label: '已完成', value: '已完成' },
  { label: '已取消', value: '已取消' }
]

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      userId: appStore.userInfo.id,
      page: currentPage.value,
      size: pageSize.value,
      status: statusFilter.value || undefined
    }
    const data = await mainRequest.get('/orders/my', { params })
    orders.value = data.records
    total.value = data.total
  } catch (error) {
    ElMessage.error(error||'获取订单列表失败')
  } finally {
    loading.value = false
  }
}
const StatusColor = (status) => {
  const map = {'已支付': 'status-completed', '已完成':'status-cancelled', "异常":'status-cancelled'};
  return map[status] || 'status-completed';
};
const handleFilterChange = () => {
  currentPage.value = 1
  fetchOrders()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchOrders()
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

const viewDetail = (id) => {
  router.push(`/order/${id}`)
}

onMounted(() => {
  fetchOrders()
})
</script>
<style scoped>
/* ========== 布局特有样式（保留） ========== */

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.page-header {
  margin-top: 70px;
  padding: 10px 0;
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

.page-header__breadcrumb a {
  color: var(--white);
  text-decoration: none;
}

.page-header__breadcrumb a:hover {
  text-decoration: underline;
}

.filter-bar {
  margin: 20px 0;
  display: flex;
  justify-content: flex-start;
}

.filter-bar .el-select {
  width: 200px;
}

.order-list {
  padding: 20px 0 40px;
}

.order-card {
  display: flex;
  align-items: center;
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  margin-bottom: 15px;
  transition: var(--transition);
}

.order-card:hover {
  box-shadow: var(--shadow-md);
}

.order-card__left {
  margin-right: 20px;
}

.order-card__image {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background-color: #eee;
}

.order-card__center {
  flex: 1;
}

.order-card__car {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 8px;
}

.order-card__info {
  color: var(--text-light);
  font-size: 0.9rem;
  display: flex;
  gap: 20px;
}

.order-card__right {
  text-align: right;
  min-width: 200px;
}

.order-card__price {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 5px;
}

.order-card__status {
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 10px;
  margin-right: 50px;
}

/* 订单状态颜色（保留，非全局通用） */
.status-completed {
  background: #e3f7e7;
  color: #0b6e2e;
}

.status-upcoming {
  background: #fff3cd;
  color: #856404;
}

.status-cancelled {
  background: #f8d7da;
  color: #721c24;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

/* 分页容器（只保留布局，具体样式已全局） */
.el-pagination {
  margin-top: 30px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .order-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-card__left {
    margin-right: 0;
    margin-bottom: 15px;
  }

  .order-card__right {
    text-align: left;
    width: 100%;
    margin-top: 15px;
  }
}
</style>