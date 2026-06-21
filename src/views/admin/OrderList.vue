<template>
  <div class="order-list">
    <page-header title="订单管理" description="管理校园租车平台的所有租赁订单">
    </page-header>

    <!-- 统计概览卡片 -->
    <el-row :gutter="16" style="margin-top: 20px;display: flex;flex-wrap: nowrap">
      <el-col v-for="stat in statistics" :key="stat.status" style="flex:1;min-width: 0">
        <el-card
            :class="['stat-card', { 'stat-card--active': activeStat === stat.status }]"
            shadow="hover"
            @click="handleStatClick(stat)"
        >
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="stat-icon" :class="`stat-icon--${stat.status}`">
              {{ stat.icon }}
            </div>
            <div>
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索筛选区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <el-form :inline="true" :model="searchForm" label-width="auto"
               style="display: flex;flex-wrap: nowrap;justify-content: center;align-items: center">
        <el-form-item label="订单编号" style="flex:1;min-width: 0">
          <el-input v-model="searchForm.orderNo" placeholder="输入订单编号" clearable/>
        </el-form-item>
        <el-form-item label="用户信息">
          <el-input v-model="searchForm.userInfo" placeholder="姓名/手机号" clearable/>
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker
              v-model="searchForm.startDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
              v-model="searchForm.endDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span><el-icon><List/></el-icon> 订单列表</span>
          <el-tag type="info" size="small">共 {{ total }} 条记录</el-tag>
        </div>
      </template>

      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column label="订单编号" width="240">
          <template #default="{ row }">
            <span class="order-id">#{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column label="用户信息" min-width="50">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 10px;">
              <el-avatar :size="32" :style="{ background: row.userAvatarColor }">
                {{ row.userName.charAt(0) }}
              </el-avatar>
              <div>
                <div>{{ row.userName }}</div>
                <div style="font-size: 12px; color: #909399;">{{ row.userPhone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="车辆信息" min-width="120">
          <template #default="{ row }">
            <div>
              <div>{{ row.vehicleName }}</div>
              <div style="font-size: 12px; color: #909399;">{{ row.plate }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="租期" width="300">
          <template #default="{ row }">
            <div>
              <div>{{ row.rentalPeriod }}</div>
              <div style="font-size: 12px; color: #909399;">共{{ row.days }}天</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="180">
          <template #default="{ row }">
            <span style="color: var(--el-color-danger); font-weight: 600;">
              ¥{{ row.amount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="orderStatusTag(row.status)" size="small" effect="light">
              {{ orderStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" :icon="View" circle size="small" @click="handleView(row)"/>
            <!-- 待支付：可取消 -->
            <el-button
                v-if="row.status === '待支付'"
                type="danger"
                :icon="Close"
                circle
                size="small"
                @click="handleCancel(row)"
            />
            <!-- 已支付：可取消（如允许） -->
            <el-button
                v-if="row.status === '已支付'"
                type="danger"
                :icon="Close"
                circle
                size="small"
                @click="handleCancel(row)"
            />
            <!-- 待取车审核：确认取车 -->
            <el-button
                v-if="row.status === '待取车'"
                type="success"
                :icon="Check"
                circle
                size="small"
                @click="handleConfirmPickup(row)"
            />
            <!-- 租赁中：可标记异常或待还车？实际应等待用户申请还车，管理员确认还车 -->
            <el-button
                v-if="row.status === '租赁中'"
                type="warning"
                :icon="WarningFilled"
                circle
                size="small"
                @click="handleAbnormal(row)"
            />
            <!-- 待还车审核：确认还车（打开罚金弹窗） -->
            <el-button
                v-if="row.status === '待还车'"
                type="success"
                :icon="Finished"
                circle
                size="small"
                @click="handleConfirmReturn(row)"
            />
            <!-- 异常：可处理（如重试） -->
            <el-button
                v-if="row.status === '异常'"
                type="warning"
                :icon="WarningFilled"
                circle
                size="small"
                @click="handleAbnormal(row)"
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 20px; display: flex; justify-content: center;">
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog
        v-model="detailDialogVisible"
        :title="`订单详情 - #${currentOrder?.orderNo}`"
        width="700px"
        destroy-on-close
    >
      <div class="order-detail" v-if="currentOrder">
        <!-- 基本信息 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span><el-icon><InfoFilled/></el-icon> 订单信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单编号">{{ currentOrder.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="orderStatusTag(currentOrder.status)" size="small">
                {{ orderStatusText(currentOrder.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ currentOrder.createTime }}</el-descriptions-item>
            <el-descriptions-item label="支付方式">{{ currentOrder.paymentMethod || '微信支付' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 用户信息 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span><el-icon><User/></el-icon> 用户信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户姓名">{{ currentOrder.userName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentOrder.userPhone }}</el-descriptions-item>
            <el-descriptions-item label="身份证号">{{
                currentOrder.idCard || '110101********1234'
              }}
            </el-descriptions-item>
            <el-descriptions-item label="驾驶证号">{{
                currentOrder.licenseNo || '110101********5678'
              }}
            </el-descriptions-item>
            <el-descriptions-item label="用户角色">
              <el-tag size="small" :type="roleTag(currentOrder.userRole)">
                {{ roleText(currentOrder.userRole) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 车辆信息 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span><el-icon><Car/></el-icon> 车辆信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="车辆名称">{{ currentOrder.vehicleName }}</el-descriptions-item>
            <el-descriptions-item label="车牌号码">{{ currentOrder.plate }}</el-descriptions-item>
            <el-descriptions-item label="车辆类型">{{
                currentOrder.vehicleType || '轿车 / 自动挡'
              }}
            </el-descriptions-item>
            <el-descriptions-item label="车身颜色">{{ currentOrder.color || '白色' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 租赁信息 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span><el-icon><Calendar/></el-icon> 租赁信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="取车时间">{{ currentOrder.pickupTime }}</el-descriptions-item>
            <el-descriptions-item label="还车时间">{{ currentOrder.returnTime }}</el-descriptions-item>
            <el-descriptions-item label="租赁天数">{{ currentOrder.days }}天</el-descriptions-item>
            <el-descriptions-item label="取车地点">{{
                currentOrder.pickupLocation || '校园东门服务点'
              }}
            </el-descriptions-item>
            <el-descriptions-item label="还车地点">{{ currentOrder.returnLocation || '未指定' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 增值服务卡片 -->
        <el-card shadow="never" class="detail-section" v-if="currentOrder.services?.length">
          <template #header>
            <span><el-icon><Goods/></el-icon> 增值服务</span>
          </template>
          <el-table :data="currentOrder.services" border stripe size="small">
            <el-table-column prop="name" label="服务名称"/>
            <el-table-column prop="price" label="单价(元/天)" width="120"/>
          </el-table>
        </el-card>

        <!-- 费用明细 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span><el-icon><Money/></el-icon> 费用明细</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="日租金">¥{{ (currentOrder.carSubtotal / currentOrder.days).toFixed(2) }}/天</el-descriptions-item>
            <el-descriptions-item label="天数">{{ currentOrder.days }}天</el-descriptions-item>
            <el-descriptions-item label="车辆租金小计">¥{{ currentOrder.carSubtotal.toFixed(2) }}</el-descriptions-item>

            <!-- 优惠明细 -->
            <template v-if="currentOrder.priceResult?.discountItems?.length">
              <el-descriptions-item label="优惠明细" :span="2">
                <div v-for="item in currentOrder.priceResult.discountItems" :key="item.key" style="display: flex; justify-content: space-between;">
                  <span>{{ item.description }}</span>
                  <span style="color: var(--el-color-success);">-¥{{ item.amount.toFixed(2) }}</span>
                </div>
              </el-descriptions-item>
            </template>

            <el-descriptions-item label="服务费用小计" v-if="currentOrder.servicesSubtotal > 0">¥{{ currentOrder.servicesSubtotal.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="押金">¥{{ currentOrder.deposit }} </el-descriptions-item>

            <!-- 罚金区域 -->
            <el-descriptions-item label="罚金总额" :span="2">
              <span style="color: var(--el-color-danger); font-weight: 600;">¥{{ (currentOrder.penaltyAmount || 0).toFixed(2) }}</span>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentOrder.penalties?.length" label="罚金明细" :span="2">
              <div v-for="p in currentOrder.penalties" :key="p.reason" style="display: flex; justify-content: space-between;">
                <span>{{ p.reason }}</span>
                <span>¥{{ p.amount.toFixed(2) }}</span>
              </div>
            </el-descriptions-item>

            <el-descriptions-item label="金额 (含押金)" :span="2" label-width="150">
              <span style="font-size: 1.2rem;">¥{{ currentOrder.amount.toFixed(2) }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 订单动态 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span><el-icon><Timer/></el-icon> 订单动态</span>
          </template>
          <el-timeline>
            <el-timeline-item
                v-for="(log, index) in orderLogs"
                :key="index"
                :timestamp="log.time"
                placement="top"
            >
              {{ log.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 通用确认操作对话框（仅用于取车、取消、异常） -->
    <el-dialog
        v-model="confirmDialogVisible"
        :title="confirmTitle"
        width="400px"
        center
    >
      <div style="text-align: center; padding: 20px;">
        <el-icon :size="40" :color="confirmIconColor" style="margin-bottom: 16px;">
          <component :is="confirmIcon"/>
        </el-icon>
        <h3>{{ confirmTitle }}</h3>
        <p style="color: #909399;">{{ confirmMessage }}</p>
      </div>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button :type="confirmButtonType" @click="handleConfirmAction">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 确认还车专用对话框（含罚金和备注） -->
    <!-- 确认还车专用对话框（支持多笔罚金） -->
    <el-dialog
        v-model="confirmReturnDialogVisible"
        title="确认还车"
        width="600px"
        center
        destroy-on-close
    >
      <div style="padding: 20px;">
        <!-- 罚金列表 -->
        <div class="penalty-list">
          <div class="penalty-header">
            <span>罚金明细</span>
            <el-button type="primary" link @click="addPenaltyItem">+ 添加罚金</el-button>
          </div>
          <div v-for="(item, index) in penaltyItems" :key="index" class="penalty-item">
            <el-input
                v-model="item.reason"
                placeholder="罚金原因（如：超时费）"
                style="width: 160px;"
            />
            <el-input-number
                v-model="item.amount"
                :min="0"
                :precision="2"
                :step="10"
                placeholder="金额"
                controls-position="right"
                style="width: 150px;"
            />
            <el-button type="danger" :icon="Delete" circle size="small" @click="removePenaltyItem(index)" />
          </div>
          <div v-if="penaltyItems.length === 0" class="penalty-empty">
            暂无罚金，点击上方按钮添加
          </div>
        </div>

        <!-- 总体备注 -->
        <el-form label-width="100px" style="margin-top: 20px;">
          <el-form-item label="总体备注">
            <el-input
                v-model="returnDescription"
                type="textarea"
                :rows="2"
                placeholder="可填写总体说明（选填）"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="confirmReturnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitConfirmReturn">确认还车</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted, computed} from 'vue'
import {
  DataLine, List, View, Check, Finished, Close,
  InfoFilled, User, Calendar, Money, Timer,
  QuestionFilled, SuccessFilled, WarningFilled, Goods
} from '@element-plus/icons-vue'
import {ElMessage} from 'element-plus'
import {adminRequest} from '@/api'
import PageHeader from "@/components/admin/PageHeader.vue";

const loading = ref(false)
const detailLoading = ref(false)
const actionLoading = ref(false)
const penaltyItems = ref([{ reason: '', amount: 0 }])
// 统计卡片数据（对应8种状态 + all）
const statistics = ref([
  {status: 'all', label: '全部订单', value: 0, icon: '📋'},
  {status: 'pendingPayment', label: '待支付', value: 0, icon: '⏳'},
  {status: 'paid', label: '已支付', value: 0, icon: '✅'},
  {status: 'pendingPickup', label: '待取车', value: 0, icon: '⏱️'},
  {status: 'renting', label: '租赁中', value: 0, icon: '🔄'},
  {status: 'pendingReturn', label: '待还车', value: 0, icon: '⏱️'},
  {status: 'completed', label: '已完成', value: 0, icon: '🏁'},
  {status: 'cancelled', label: '已取消', value: 0, icon: '❌'},
  {status: 'abnormal', label: '异常', value: 0, icon: '⚠️'}
])

const activeStat = ref('all')

const searchForm = reactive({
  orderNo: '',
  userInfo: '',
  status: '',
  startDate: '',
  endDate: ''
})
const addPenaltyItem = () => {
  penaltyItems.value.push({ reason: '', amount: 0 })
}
// 删除罚金项
const removePenaltyItem = (index) => {
  penaltyItems.value.splice(index, 1)
}
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const detailDialogVisible = ref(false)
const currentOrder = ref(null)
const orderLogs = ref([])

// 通用确认对话框（取车、取消、异常）
const confirmDialogVisible = ref(false)
const confirmAction = ref('') // 'confirmPickup', 'cancel', 'abnormal'
const confirmOrderNo = ref('')

// 确认还车专用对话框
const confirmReturnDialogVisible = ref(false)
const returnPenalty = ref(0)
const returnDescription = ref('')
const currentReturnOrderNo = ref('')

const depositStatusTag = (status) => {
  const map = {'未收取': 'info', '已收取': 'success', '已退还': 'primary'}
  return map[status] || 'info'
}

// 状态映射函数
const orderStatusTag = (status) => {
  const map = {
    pendingPayment: 'warning',
    paid: 'success',
    pendingPickup: 'info',
    renting: 'primary',
    pendingReturn: 'warning',
    completed: 'success',
    cancelled: 'danger',
    abnormal: 'danger'
  }
  return map[status] || 'info'
}

const orderStatusText = (status) => {
  const map = {
    pendingPayment: '待支付',
    paid: '已支付',
    pendingPickup: '待取车审核',
    renting: '租赁中',
    pendingReturn: '待还车审核',
    completed: '已完成',
    cancelled: '已取消',
    abnormal: '异常'
  }
  return map[status] || status
}
const roleTag = (role) => {
  const map = {ordinary: 'info', student: 'success',  admin: 'danger'}
  return map[role] || 'info'
}
const roleText = (role) => {
  const map = {ordinary: '普通用户', student: '学生', admin: '管理员'}
  return map[role] || role
}

// 通用确认弹窗内容
const confirmTitle = computed(() => {
  const map = {
    confirmPickup: '确认取车',
    cancel: '取消订单',
    abnormal: '标记异常'
  }
  return map[confirmAction.value] || '确认操作'
})

const confirmMessage = computed(() => {
  const map = {
    confirmPickup: `您确定订单 #${confirmOrderNo.value} 已取车吗？确认后将进入租赁中。`,
    cancel: `您确定要取消订单 #${confirmOrderNo.value} 吗？`,
    abnormal: `您确定要将订单 #${confirmOrderNo.value} 标记为异常吗？`
  }
  return map[confirmAction.value] || '请确认操作'
})

const confirmIcon = computed(() => {
  const map = {
    confirmPickup: SuccessFilled,
    cancel: WarningFilled,
    abnormal: WarningFilled
  }
  return map[confirmAction.value] || QuestionFilled
})

const confirmIconColor = computed(() => {
  const map = {
    confirmPickup: '#67C23A',
    cancel: '#F56C6C',
    abnormal: '#E6A23C'
  }
  return map[confirmAction.value] || '#909399'
})

const confirmButtonType = computed(() => {
  const map = {
    confirmPickup: 'success',
    cancel: 'danger',
    abnormal: 'warning'
  }
  return map[confirmAction.value] || 'primary'
})

// ==================== API ====================

const fetchStatistics = async () => {
  try {
    const res = await adminRequest.get('/orders/statistics')
    statistics.value = statistics.value.map(stat => ({
      ...stat,
      value: res[stat.status] || 0
    }))
  } catch (error) {
    ElMessage.error('获取统计失败')
  }
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      orderNo: formatDate(searchForm.orderNo) || undefined,
      userInfo: searchForm.userInfo || undefined,
      status: searchForm.status || undefined,
      startDate: searchForm.startDate || undefined,
      endDate: searchForm.endDate || undefined
    }
    const res = await adminRequest.get('/orders', {params})
    tableData.value = res.records
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (order_no) => {
  return order_no.startsWith('#') ? order_no.substring(1, order_no.length) : order_no
}

const fetchOrderDetail = async (orderNo) => {
  detailLoading.value = true
  try {
    const data = await adminRequest.get(`/orders/${orderNo}`)
    currentOrder.value = data
    orderLogs.value = data.logs || []
  } catch (error) {
    ElMessage.error('获取订单详情失败')
  } finally {
    detailLoading.value = false
  }
}

// 通用操作（取车、取消、异常）
const performAction = async (action, orderNo) => {
  actionLoading.value = true
  try {
    const urlMap = {
      confirmPickup: '/orders/confirmPickup',
      cancel: '/orders/cancel',
      abnormal: '/orders/abnormal'
    }
    await adminRequest.put(urlMap[action], {orderNo})
    ElMessage.success('操作成功')
    await fetchOrders()
    await fetchStatistics()
    if (detailDialogVisible.value && currentOrder.value?.orderNo === orderNo) {
      await fetchOrderDetail(orderNo)
    }
  } catch (error) {
    ElMessage.error(error || '操作失败')
  } finally {
    actionLoading.value = false
    confirmDialogVisible.value = false
  }
}

// 提交确认还车
const submitConfirmReturn = async () => {
  // 校验：每项必须有原因和金额>0（允许0元罚金？如果金额为0可以不传？建议过滤掉金额为0的项）
  const validItems = penaltyItems.value.filter(item => item.amount > 0 && item.reason.trim() !== '')
  if (validItems.length === 0 && penaltyItems.value.some(item => item.amount > 0)) {
    ElMessage.warning('请填写罚金原因和金额')
    return
  }

  const requestData = {
    orderNo: currentReturnOrderNo.value,
    penalties: validItems,
    description: returnDescription.value
  }

  try {
    await adminRequest.put('/orders/confirmReturn', requestData)
    ElMessage.success('确认还车成功')
    await fetchOrders()
    await fetchStatistics()
    if (detailDialogVisible.value && currentOrder.value?.orderNo === currentReturnOrderNo.value) {
      await fetchOrderDetail(currentReturnOrderNo.value)
    }
    confirmReturnDialogVisible.value = false
  } catch (error) {
    ElMessage.error(error || '操作失败')
  } finally {
    // 重置
    penaltyItems.value = [{ reason: '', amount: 0 }]
    returnDescription.value = ''
    currentReturnOrderNo.value = ''
  }
}
// ==================== 事件 ====================

const handleStatClick = (stat) => {
  activeStat.value = stat.status
  if (stat.status === 'all') {
    searchForm.status = ''
  } else {
    const statusMap = {
      pendingPayment: '待支付',
      paid: '已支付',
      pendingPickup: '待取车',
      renting: '租赁中',
      pendingReturn: '待还车',
      completed: '已完成',
      cancelled: '已取消',
      abnormal: '异常'
    }
    searchForm.status = statusMap[stat.status] || ''
  }
  handleSearch()
  fetchStatistics()
}

const handleSearch = () => {
  currentPage.value = 1
  fetchOrders()
}

const resetSearch = () => {
  searchForm.orderNo = ''
  searchForm.userInfo = ''
  searchForm.status = ''
  searchForm.startDate = ''
  searchForm.endDate = ''
  activeStat.value = 'all'
  handleSearch()
}

const handleExport = () => {
  ElMessage.success('导出报表功能开发中')
}

const handleView = async (row) => {
  await fetchOrderDetail(row.orderNo)
  detailDialogVisible.value = true
}

// 确认取车（使用通用确认弹窗）
const handleConfirmPickup = (row) => {
  confirmAction.value = 'confirmPickup'
  confirmOrderNo.value = row.orderNo
  confirmDialogVisible.value = true
}

// // 确认还车（打开罚金弹窗）
// const handleConfirmReturn = (row) => {
//   currentReturnOrderNo.value = row.orderNo
//   returnPenalty.value = 0
//   returnDescription.value = ''
//   confirmReturnDialogVisible.value = true
// }
// 打开确认还车弹窗时重置数据
const handleConfirmReturn = (row) => {
  currentReturnOrderNo.value = row.orderNo
  penaltyItems.value = [{ reason: '', amount: 0 }]  // 重置为一条空记录
  returnDescription.value = ''
  confirmReturnDialogVisible.value = true
}
// 取消订单（使用通用确认弹窗）
const handleCancel = (row) => {
  confirmAction.value = 'cancel'
  confirmOrderNo.value = row.orderNo
  confirmDialogVisible.value = true
}

// 标记异常（使用通用确认弹窗）
const handleAbnormal = (row) => {
  confirmAction.value = 'abnormal'
  confirmOrderNo.value = row.orderNo
  confirmDialogVisible.value = true
}

// 通用确认操作回调
const handleConfirmAction = () => {
  performAction(confirmAction.value, confirmOrderNo.value)
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchOrders()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchOrders()
}

onMounted(() => {
  fetchStatistics()
  fetchOrders()
})
</script>

<style scoped>
.order-list {
  padding: 0;
  width: 99%;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--el-text-color-primary);
}

/* 统计卡片 */
.stat-card {
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}

.stat-card--active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.stat-icon--all {
  background-color: #f5f7fa;
}

.stat-icon--pending {
  background-color: #fff3cd;
}

.stat-icon--ongoing {
  background-color: #cce5ff;
}

.stat-icon--completed {
  background-color: #d4edda;
}

.stat-icon--cancelled {
  background-color: #f8d7da;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

/* 订单编号 */
.order-id {
  font-weight: 600;
  color: var(--el-color-primary);
}

/* 详情卡片间距 */
.detail-section {
  margin-bottom: 20px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

/* 调整描述列表标签宽度 */
:deep(.el-descriptions__label) {
  width: 100px;
}

.form-hint {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.penalty-list {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
}

.penalty-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.penalty-item {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.penalty-empty {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 16px;
}
</style>