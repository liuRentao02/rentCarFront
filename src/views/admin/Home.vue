<template>
  <div class="dashboard-container">
    <!-- 1. 顶部欢迎栏 + 快捷按钮 + 消息提醒 -->
    <div class="header-section">
      <div class="welcome-box">
        <h2 class="welcome-title">
          上午好，{{ username }}
          <span class="weather-tag" v-if="isMorning">☀️ 今天天气不错，是个租车的好日子</span>
        </h2>
        <p class="welcome-desc">以下是校园租车平台的最新运营概况 ({{ currentTime }})</p>
      </div>
    </div>

    <!-- 加载状态 -->
    <el-skeleton v-if="loading" :rows="10" animated style="margin-top: 20px" />

    <template v-else>
      <!-- 2. 核心数据概览 (8张卡，分2行) -->
      <el-row :gutter="20" class="stats-section">
        <el-col :span="6" v-for="(item, index) in coreStats" :key="index">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-left">
                <div class="stat-label">{{ item.label }}</div>
                <div class="stat-value">{{ item.value }}</div>
              </div>
              <div class="stat-icon-box">
                <el-icon :size="40" :color="item.iconColor">
                  <component :is="item.icon" />
                </el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 3. 高频功能（左） + 预警告警（右） -->
      <el-row :gutter="24" class="todo-warning-section">
        <!-- 左侧：高频功能（替代原来的待办事项） -->
        <el-col :span="24">
          <el-card shadow="hover" class="section-card fixed-height-card">
            <template #header>
              <div class="card-header">
                <el-icon color="#67c23a"><Grid /></el-icon>
                <span class="title">高频功能</span>
              </div>
            </template>
            <div class="actions-grid">
              <div v-for="action in quickActions" :key="action.name" class="action-item" @click="router.push(action.path)">
                <div class="action-icon-box" :style="{ background: action.bgColor }">
                  <el-icon :size="28" :color="action.iconColor">
                    <component :is="action.icon" />
                  </el-icon>
                </div>
                <span class="action-name">{{ action.name }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 4. 数据趋势图表区 -->
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card shadow="hover" class="section-card">
            <template #header>
              <div class="card-header">
                <el-icon color="#909399"><TrendCharts /></el-icon>
                <span class="title">近30天订单 & 营收趋势</span>
              </div>
            </template>
            <v-chart :option="orderRevenueOption" class="chart" autoresize />
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="hover" class="section-card">
            <template #header>
              <div class="card-header">
                <el-icon color="#909399"><Van /></el-icon>
                <span class="title">车辆出租率</span>
              </div>
            </template>
            <v-chart :option="rentRateOption" class="chart" autoresize />
          </el-card>
        </el-col>
      </el-row>

      <!-- 5. 最新动态 (Tab切换) -->
      <el-card shadow="hover" class="section-card">
        <template #header>
          <div class="card-header">
            <el-icon color="#909399"><Clock /></el-icon>
            <span class="title">最新动态</span>
          </div>
        </template>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="最新订单" name="orders">
            <el-table :data="latestOrders" style="width: 100%">
              <el-table-column prop="orderNo" label="订单号" width="180" />
              <el-table-column prop="userName" label="用户" width="120" />
              <el-table-column prop="vehicleName" label="车辆" width="150" />
              <el-table-column prop="amount" label="金额" width="100">
                <template #default="{ row }">
                  <span style="color: #f56c6c; font-weight: bold">¥{{ row.amount }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.statusType" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="下单时间" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="最新注册" name="users">
            <el-table :data="latestUsers" style="width: 100%">
              <el-table-column prop="avatar" label="头像" width="80">
                <template #default="{ row }">
                  <el-avatar :size="32" :src="row.avatar" />
                </template>
              </el-table-column>
              <el-table-column prop="realName" label="姓名" width="120" />
              <el-table-column prop="phone" label="手机号" width="140" />
              <el-table-column prop="authStatus" label="认证状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.authType" size="small">{{ row.authStatus === 0 ? '待认证' :  row.authStatus === 1 ? '认证通过' : '认证失败'}}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="registerTime" label="注册时间" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'
import {
  Document, CircleCheck, Bell, List, Warning, Grid, TrendCharts, Van, Clock,
  User, ShoppingCart, Van as CarIcon, Money, Ticket, Setting, Tools, DataLine,
  UserFilled, ChatDotRound, ArrowUp, Position
} from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { adminRequest } from '@/api' // 确保这个导入路径正确

use([
  CanvasRenderer,
  LineChart, PieChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent
])

const router = useRouter()
const appStore = useAppStore()

// --- 基础状态 ---
const loading = ref(false)
const username = computed(() => appStore.userInfo?.realName || '管理员')
const currentTime = ref(new Date().toLocaleString())
const isMorning = new Date().getHours() < 12
const activeTab = ref('orders')

// --- 数据容器 (初始化为空，等待接口返回) ---
const statisticsData = ref({})
const todos = ref([])
const warnings = ref([])
const orderTrendData = ref([])
const revenueTrendData = ref([])
const rentRateData = ref([])
const latestOrders = ref([])
const latestUsers = ref([])

// --- 1. 核心指标配置 (UI 配置保留在前端，数值动态填充) ---
const statConfig = [
  { key: 'totalUsers', label: '总用户数', icon: User, iconColor: '#409eff', format: v => v?.toLocaleString() },
  { key: 'todayNewUsers', label: '今日新增', icon: UserFilled, iconColor: '#67c23a', format: v => v },
  { key: 'totalVehicles', label: '总车辆数', icon: CarIcon, iconColor: '#e6a23c', format: v => v },
  { key: 'availableVehicles', label: '空闲车辆', icon: Position, iconColor: '#909399', format: v => v },
  { key: 'todayOrders', label: '今日订单', icon: ShoppingCart, iconColor: '#409eff', format: v => v },
  { key: 'todayRevenue', label: '今日营收', icon: Money, iconColor: '#67c23a', format: v => `¥${v}` },
  { key: 'todoCount', label: '待办工单', icon: ChatDotRound, iconColor: '#e6a23c', format: v => v },
  { key: 'overdueOrders', label: '逾期订单', icon: Warning, iconColor: '#f56c6c', format: v => v }
]

// 计算属性：合并配置和数据
const coreStats = computed(() => {
  return statConfig.map(item => ({
    ...item,
    value: item.format(statisticsData.value[item.key] ?? 0),
    trend: 12.5 // 趋势可以由后端返回，这里暂时固定模拟
  }))
})

const todoCount = computed(() => statisticsData.value.todoCount || 0)

// --- 2. 高频功能配置（精简后，仅保留核心业务）---
const quickActions = ref([
  { name: '新增车辆', icon: CarIcon, path: '/admin/vehicle/list', bgColor: '#ecf5ff', iconColor: '#409eff' },
  { name: '订单管理', icon: ShoppingCart, path: '/admin/order/list', bgColor: '#f0f9eb', iconColor: '#67c23a' },
  { name: '用户管理', icon: User, path: '/admin/user/list', bgColor: '#fdf6ec', iconColor: '#e6a23c' },
  { name: '发布公告', icon: Document, path: '/admin/notice/list', bgColor: '#fef0f0', iconColor: '#f56c6c' },
])

// --- 3. 图表配置 (依赖响应式数据) ---
const orderRevenueOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['订单量', '营收'], top: 0 },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: orderTrendData.value.map(d => d.date)
  },
  yAxis: [
    { type: 'value', name: '订单量', position: 'left' },
    { type: 'value', name: '营收(元)', position: 'right' }
  ],
  series: [
    {
      name: '订单量',
      type: 'line',
      smooth: true,
      data: orderTrendData.value.map(d => d.value),
      itemStyle: { color: '#409eff' },
      areaStyle: { opacity: 0.1 }
    },
    {
      name: '营收',
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      data: revenueTrendData.value.map(d => d.value),
      itemStyle: { color: '#67c23a' }
    }
  ]
}))

const rentRateOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%', left: 'center' },
  series: [
    {
      name: '车辆状态',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: {
        label: { show: true, fontSize: 20, fontWeight: 'bold' }
      },
      data: rentRateData.value.map(item => ({
        name: item.name,
        value: item.value,
        itemStyle: {
          color: item.name === '在租' ? '#67c23a' : (item.name === '空闲' ? '#409eff' : '#e6a23c')
        }
      }))
    }
  ]
}))

// --- 4. 数据请求核心方法 ---
const fetchData = async () => {
  try {
    loading.value = true
    // 调用后端接口
    const res = await adminRequest.get('/dashboard/stats')

    // 数据解构赋值
    if (res) {
      statisticsData.value = res.statistics || {}
      todos.value = res.todos || []
      warnings.value = res.warnings || []
      orderTrendData.value = res.orderTrend || []
      revenueTrendData.value = res.revenueTrend || []
      rentRateData.value = res.rentRate || []
      latestOrders.value = res.latestOrders || []
      latestUsers.value = res.latestUsers || []
    }
  } catch (error) {
    ElMessage.error('数据加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// --- 交互方法 ---
const handleAudit = () => {
  router.push('/admin/certification')
}

// --- 初始化 ---
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.dashboard-container {
  padding: 0 0 40px;
}

/* 1. 顶部区域 */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.welcome-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

.weather-tag {
  font-size: 14px;
  font-weight: normal;
  background: rgba(255,255,255,0.2);
  padding: 4px 12px;
  border-radius: 20px;
}

.welcome-desc {
  margin: 8px 0 0 0;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.item-badge {
  margin-left: 8px;
}

/* 2. 统计卡片 */
.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  border: none;
  overflow: hidden;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--el-text-color);
  line-height: 1;
  margin-bottom: 8px;
}

.stat-icon-box {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

/* 通用卡片样式 */
.section-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-item:hover {
  background: var(--el-bg-color);
  transform: translateY(-3px);
}

.action-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-name {
  font-size: 14px;
  color: var(--el-text-color);
}

.fixed-height-card .el-card__body {
  height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  flex: 1;
  align-content: start;
}

.warning-list {
  height: 280px;
  flex: 1;
  overflow-y: visible;
}

.warning-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.warning-item:last-child { border-bottom: none; }

.warning-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 12px;
}

.warning-content { flex: 1; }
.warning-title { font-weight: 500; margin-bottom: 4px; }
.warning-desc { font-size: 12px; color: #909399; }

/* 图表 */
.chart {
  height: 350px;
  width: 100%;
  color: var(--el-text-color) !important;
}
</style>