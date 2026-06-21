<template>
  <div class="operation-log">
    <!-- 页面标题 -->
    <el-row justify="space-between" align="middle">
      <el-col :span="12">
        <h1 class="page-title">操作日志</h1>
        <el-text type="info" size="small">查看和审计系统操作记录，追踪用户行为轨迹</el-text>
      </el-col>
    </el-row>

    <!-- 统计概览卡片 -->
    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="6" v-for="stat in statistics" :key="stat.label">
        <el-card shadow="hover" class="stat-card">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="stat-icon" :class="`stat-icon--${stat.type}`">
              {{ stat.icon }}
            </div>
            <div>
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-desc">{{ stat.desc }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <el-form :inline="true" :model="filterForm" label-width="auto">
        <el-form-item label="关键词搜索">
          <el-input v-model="filterForm.keyword" placeholder="操作人 / 操作详情" clearable />
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 240px;"
          />
        </el-form-item>
        <el-form-item label="日志等级">
          <el-select v-model="filterForm.level" placeholder="全部等级" clearable style="width: 140px;">
            <el-option label="信息 / INFO" value="INFO" />
            <el-option label="警告 / WARN" value="WARN" />
            <el-option label="错误 / ERROR" value="ERROR" />
            <el-option label="调试 / DEBUG" value="DEBUG"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span><el-icon><Document /></el-icon> 操作记录</span>
          <el-tag type="info" size="small">共 {{ total }} 条记录</el-tag>
        </div>
      </template>

      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column label="操作时间" width="200" prop="createTime" sortable />
        <el-table-column label="操作人员" min-width="160">
          <template #default="{ row }">
            <div class="operator-info">
              <div class="avatar-wrapper">
                <el-avatar v-if="row.avatar" :size="32" :src="row.avatar" />
                <el-avatar v-else :size="32" :icon="UserFilled">
                  {{ row.realName ? row.realName.charAt(0) : '?' }}
                </el-avatar>
              </div>
              <div>
                <div>{{ row.realName || '-' }}</div>
                <div class="operator-id">账号: {{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="日志类型" width="120" prop="category">
          <template #default="{ row }">
            <el-tag effect="plain">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="日志等级" width="100" prop="level">
          <template #default="{ row }">
            <el-tag :type="levelTagType(row.level)" effect="dark" size="small">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="日志标题" width="180" show-overflow-tooltip prop="content" />
        <el-table-column label="日志详情" min-width="240" show-overflow-tooltip prop="detail" />
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" :icon="View" circle size="small" @click="handleView(row)" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 20px; display: flex; justify-content: center;">
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 15, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 日志详情对话框 -->
    <el-dialog
        v-model="detailDialogVisible"
        title="操作日志详情"
        width="600px"
        destroy-on-close
    >
      <div class="log-detail" v-if="currentLog">
        <!-- 头部时间与等级 -->
        <div class="detail-header">
          <div class="detail-time">
            <el-icon><Clock /></el-icon>
            {{ currentLog.createTime }}
          </div>
          <el-tag :type="levelTagType(currentLog.level)" size="large" effect="dark">
            {{ currentLog.level }}
          </el-tag>
        </div>

        <!-- 基础信息 -->
        <el-descriptions :column="2" border style="margin-top: 20px;">
          <el-descriptions-item label="操作人员">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-avatar :size="24" :src="currentLog.avatar"/>
              <span>{{ currentLog.realName || '-' }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="登录账号">
            <span class="operator-id">{{ currentLog.username || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="日志类型">
            <el-tag effect="plain">{{ currentLog.category || '-' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="日志等级">
            <el-tag :type="levelTagType(currentLog.level)" effect="dark" size="small">{{ currentLog.level }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 日志内容详情 -->
        <el-card shadow="never" class="detail-section">
          <template #header>
            <span><el-icon><InfoFilled /></el-icon> 日志内容</span>
          </template>
          <div class="log-content-box">
            <div class="log-content-item">
              <span class="log-content-label">操作标题：</span>
              <span>{{ currentLog.content || '-' }}</span>
            </div>
            <div class="log-content-item" v-if="currentLog.detail">
              <span class="log-content-label">详细描述：</span>
              <span>{{ currentLog.detail }}</span>
            </div>
            <el-empty v-if="!currentLog.content && !currentLog.detail" description="暂无详细内容" :image-size="60" />
          </div>
        </el-card>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { View, Document, InfoFilled, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { adminRequest } from '@/api/index'

// 统计卡片数据（后续可替换为真实接口）
const statistics = ref([
  { type: 'primary', icon: '📝', label: '今日操作', value: '0', desc: '今日系统日志总数' },
  { type: 'success', icon: '✅', label: 'INFO日志', value: '0', desc: '常规信息记录' },
  { type: 'warning', icon: '⚠️', label: 'WARN日志', value: '0', desc: '潜在异常警告' },
  { type: 'danger', icon: '❌', label: 'ERROR日志', value: '0', desc: '错误执行记录' }
])

const fetchStatistics = async () => {
  try {
    const res = await adminRequest.get("/systemLog/statistics");

    // 只把后端返的数值赋给对应卡片的 value，保留原本的 icon、label、type 等配置
    statistics.value[0].value = res.total_count || 0;
    statistics.value[1].value = res.info_count || 0;
    statistics.value[2].value = res.warn_count || 0;
    statistics.value[3].value = res.error_count || 0;
  } catch (error) {
    console.error("获取统计数据失败", error);
  }
}


// 筛选表单
const filterForm = reactive({
  keyword: '',
  dateRange: [],
  level: ''
})

// 表格数据
const tableData = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 详情对话框
const detailDialogVisible = ref(false)
const currentLog = ref(null)

// 等级标签颜色映射
const levelTagType = (level) => {
  const map = {
    'INFO': 'info',
    'WARN': 'warning',
    'ERROR': 'danger',
    'DEBUG': ''
  }
  return map[level] || 'info'
}

// 获取日志列表
const fetchLogs = async () => {
  try {
    const params = {
      keyword: filterForm.keyword,
      level: filterForm.level,
      startTime: filterForm.dateRange?.[0],
      endTime: filterForm.dateRange?.[1],
      page: currentPage.value,
      size: pageSize.value
    }
    const res = await adminRequest.post('/systemLog/list', params)
    tableData.value = res.records
    total.value = res.total
  } catch (error) {
    ElMessage.error('加载日志失败')
  }
}

// 查看详情（直接展示行数据，不造假数据）
const handleView = (row) => {
  currentLog.value = row
  detailDialogVisible.value = true
}

const handleFilter = () => {
  currentPage.value = 1
  fetchLogs()
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.dateRange = []
  filterForm.level = ''
  handleFilter()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchLogs()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchLogs()
}

onMounted(() => {
  fetchLogs()
  fetchStatistics()
})
</script>

<style scoped>
.operation-log {
  padding: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--el-text-color-primary);
}

/* 统计卡片 */
.stat-card {
  cursor: default;
  transition: all 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}
.stat-icon--primary { background: linear-gradient(135deg, #e8f1fc, #d0e3f7); color: var(--el-color-primary); }
.stat-icon--success { background: linear-gradient(135deg, #d4edda, #c3e6cb); color: var(--el-color-success); }
.stat-icon--warning { background: linear-gradient(135deg, #fff3cd, #ffeeba); color: #d39e00; }
.stat-icon--danger { background: linear-gradient(135deg, #f8d7da, #f5c6cb); color: var(--el-color-danger); }
.stat-label { font-size: 0.85rem; color: var(--el-text-color-secondary); margin-bottom: 4px; }
.stat-value { font-size: 1.6rem; font-weight: 700; color: var(--el-text-color-primary); line-height: 1.2; }
.stat-desc { font-size: 0.8rem; color: var(--el-text-color-secondary); margin-top: 4px; }

/* 表格内样式 */
.operator-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.operator-id {
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
  font-family: 'Courier New', monospace;
}

/* 详情对话框 */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9), #f5f7fa);
  border-radius: 8px;
}
.detail-time {
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-primary);
}
.detail-section {
  margin-top: 20px;
}

/* 日志内容展示区 */
.log-content-box {
  padding: 10px 0;
}
.log-content-item {
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.6;
}
.log-content-item:last-child {
  margin-bottom: 0;
}
.log-content-label {
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-right: 8px;
}
</style>
