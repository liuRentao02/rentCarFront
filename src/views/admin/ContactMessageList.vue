<template>
  <div class="contact-message-list">
    <page-header title="留言管理" description="查看和管理用户提交的联系留言">
      <el-button @click="fetchData" :loading="loading">
        <el-icon><Refresh /></el-icon> 刷新
      </el-button>
    </page-header>

    <!-- 搜索筛选区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="用户名/手机号/主题/内容" clearable style="width: 260px;" />
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
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span><el-icon><ChatLineRound /></el-icon> 留言列表</span>
          <el-tag type="info" size="small">共 {{ total }} 条记录</el-tag>
        </div>
      </template>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="userName" label="用户昵称"/>
        <el-table-column prop="userPhone" label="手机号" width="120" />
        <el-table-column prop="subject" label="主题" width="140">
          <template #default="{ row }">
            {{ subjectMap[row.subject] || row.subject || '其他' }}
          </template>
        </el-table-column>
        <el-table-column prop="message" label="留言内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createTime" label="提交时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" :icon="View" circle size="small" @click="handleView(row)" title="查看详情" />
            <el-button type="danger" :icon="Delete" circle size="small" @click="handleDelete(row)" title="删除" />
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; display: flex; justify-content: center;">
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchData"
            @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailVisible" title="留言详情" width="600px" destroy-on-close>
      <div v-if="currentDetail" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户昵称">{{ currentDetail.userName }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentDetail.userPhone }}</el-descriptions-item>
          <el-descriptions-item label="留言主题">{{ subjectMap[currentDetail.subject] || currentDetail.subject || '其他' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentDetail.createTime }}</el-descriptions-item>
          <el-descriptions-item label="留言内容">
            <div class="message-full">{{ currentDetail.message }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleReply">
          回复
        </el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="confirmVisible" title="删除确认" width="400px" center>
      <div style="text-align: center; padding: 20px;">
        <el-icon :size="40" color="#F56C6C" style="margin-bottom: 16px;"><WarningFilled /></el-icon>
        <h3>确认删除该留言吗？</h3>
        <p style="color: #909399;">删除后将无法恢复</p>
      </div>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Delete, ChatLineRound, WarningFilled, View } from '@element-plus/icons-vue'
import {adminRequest, mainRequest} from '@/api'
import PageHeader from '@/components/admin/PageHeader.vue'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  keyword: ''
})

const confirmVisible = ref(false)
let currentDeleteId = null

// 详情弹窗
const detailVisible = ref(false)
const currentDetail = ref(null)

// 主题映射（根据前端可能的值）
const subjectMap = {
  inquiry: '业务咨询',
  booking: '预订问题',
  complaint: '投诉建议',
  cooperation: '商务合作',
  other: '其他'
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchForm.keyword || undefined
    }
    const res = await adminRequest.get('/contact/messages', { params })
    tableData.value = res.records
    total.value = res.total

  } catch (error) {
    ElMessage.error('获取留言列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

const resetSearch = () => {
  searchForm.keyword = ''
  handleSearch()
}

const handleView = (row) => {
  currentDetail.value = row
  detailVisible.value = true
}

const handleDelete = (row) => {
  currentDeleteId = row.id
  confirmVisible.value = true
}
// 新增：回复按钮处理函数
const handleReply = async () => {
  if (!currentDetail.value || !currentDetail.value.userId) {
    ElMessage.warning('无法获取用户信息，请确认留言数据中包含 userId')
    return
  }
  const userId = currentDetail.value.userId
  try {
    await mainRequest.post(`/chat/admin/conversation/with-user/${userId}`)
    ElMessage.success('已创建聊天会话，可在新标签页中继续回复')
    detailVisible.value = false
  } catch (error) {
    ElMessage.error(error || '创建聊天会话失败')
  }
}
const confirmDelete = async () => {
  if (!currentDeleteId) return
  try {
    await adminRequest.delete(`/contact/messages/${currentDeleteId}`)
    ElMessage.success('删除成功')
    await fetchData()
  } catch (error) {
    ElMessage.error(error || '删除失败')
  } finally {
    confirmVisible.value = false
    currentDeleteId = null
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.contact-message-list {
  padding: 0;
}

.message-full {
  white-space: pre-wrap;
  line-height: 1.6;
  max-height: 300px;
  overflow-y: auto;
}

.detail-content :deep(.el-descriptions__label) {
  width: 100px;
}
</style>