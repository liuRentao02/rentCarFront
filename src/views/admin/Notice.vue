<template>
  <div class="notice-list">
    <!-- 页面标题 -->
    <page-header title="公告管理" description="发布和管理校园租车平台的系统公告与通知">
      <el-button type="primary" @click="handleAdd" :loading="loading">
        <el-icon><Plus /></el-icon>
        发布公告
      </el-button>
    </page-header>

    <!-- 统计概览卡片 -->
    <el-row :gutter="16" style="margin-top: 20px;">
      <el-col :span="6" v-for="stat in statistics" :key="stat.type">
        <el-card
            :class="['stat-card', { 'stat-card--active': activeStat === stat.type }]"
            shadow="hover"
            @click="handleStatClick(stat)"
        >
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="stat-icon" :class="`stat-icon--${stat.type}`">
              {{ stat.icon }}
            </div>
            <div>
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">{{ stat.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索筛选区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <el-form :inline="true" :model="searchForm" label-width="auto">
        <el-form-item label="关键词搜索">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="公告标题 / 内容" 
            clearable 
            style="width: 240px;"
          />
        </el-form-item>
        <el-form-item label="公告类型">
          <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 140px;">
            <el-option label="系统公告" value="system" />
            <el-option label="活动通知" value="activity" />
            <el-option label="维护通知" value="maintenance" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 140px;">
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
            <el-option label="已下架" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker
            v-model="searchForm.publishDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 180px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span><el-icon><Document /></el-icon> 公告列表</span>
          <el-tag type="info" size="small">共 {{ total }} 条记录</el-tag>
        </div>
      </template>

      <el-table 
        :data="tableData" 
        border 
        stripe 
        style="width: 100%" 
        v-loading="loading"
      >
        <el-table-column label="公告等级" width="120">
          <template #default="{ row }">
            <el-tag :type="noticeTypeTag(row.type)" size="small" effect="light">
              {{ noticeTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="公告标题" width="120">
          <template #default="{ row }">
            <span style="font-weight: 600; color: var(--el-text-color-primary);">
                  {{ row.title }}
                </span>
          </template>
        </el-table-column>
        <el-table-column label="公告内容" width="120">
          <template #default="{ row }">
            <div style="font-size: 14px;  line-height: 1.6;">
              {{ row.content }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="发布者" width="120">
          <template #default="{ row }">
            <div>{{ row.publisher }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="noticeStatusTag(row.status)" size="small" effect="light">
              {{ noticeStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="priorityTag(row.priority)" size="small">
              {{ priorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="浏览量" width="100" sortable />
        <el-table-column label="发布时间" width="160" sortable>
          <template #default="{ row }">
            <div>{{ row.publishTime || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="预定发布时间" width="200" sortable>
          <template #default="{ row }">
            <div>{{ row.scheduledTime || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="过期时间" width="200">
          <template #default="{ row }">
            <div> {{ row.expireTime || "永久" }} </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              :icon="View" 
              circle 
              size="small" 
              @click="handleView(row)"
              title="查看详情"
            />
            <el-button 
              type="warning" 
              :icon="Edit" 
              circle 
              size="small" 
              @click="handleEdit(row)"
              title="编辑"
            />
            <el-button 
              v-if="row.status === 'draft'"
              type="success" 
              :icon="Check" 
              circle 
              size="small" 
              @click="handlePublish(row)"
              title="发布"
            />
            <el-button 
              v-if="row.status === 'published'"
              type="info" 
              :icon="Download" 
              circle 
              size="small" 
              @click="handleArchive(row)"
              title="下架"
            />
            <el-button 
              type="danger" 
              :icon="Delete" 
              circle 
              size="small" 
              @click="handleDelete(row)"
              title="删除"
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
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑公告对话框 -->
    <el-dialog
      v-model="noticeDialogVisible"
      :title="noticeDialogTitle"
      width="800px"
      destroy-on-close
      @close="handleDialogClose"
    >
      <el-form
        ref="noticeFormRef"
        :model="noticeForm"
        :rules="noticeFormRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="18">
            <el-form-item label="公告标题" prop="title">
              <el-input v-model="noticeForm.title" placeholder="请输入公告标题" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="noticeForm.priority" placeholder="请选择" style="width: 100%;">
                <el-option label="普通" value="normal" />
                <el-option label="重要" value="important" />
                <el-option label="紧急" value="urgent" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="公告类型" prop="type">
              <el-select v-model="noticeForm.type" placeholder="请选择" style="width: 100%;">
                <el-option label="系统公告" value="system" />
                <el-option label="活动通知" value="activity" />
                <el-option label="维护通知" value="maintenance" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发布状态" prop="status">
              <el-select v-model="noticeForm.status" placeholder="请选择" style="width: 100%;">
                <el-option label="草稿" value="draft" />
                <el-option label="已发布" value="published" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="公告内容" prop="content">
          <el-input
            v-model="noticeForm.content"
            type="textarea"
            :rows="10"
            placeholder="请输入公告详细内容"
            show-word-limit
            maxlength="5000"
          />
        </el-form-item>

        <el-form-item label="过期时间">
          <el-date-picker
              v-model="noticeForm.expireTime"
              type="datetime"
              placeholder="永不过期请留空"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="附件上传">
          <el-upload
            class="notice-upload"
            action="http://localhost:8080/api/upload/notice"
            v-model:file-list="fileList"
            :on-success="handleUploadSuccess"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :before-upload="beforeFileUpload"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon> 上传附件
            </el-button>
            <template #tip>
              <div style="font-size: 12px; color: var(--el-text-color-secondary); margin-top: 8px;">
                支持 PDF、Word、Excel 等格式，单个文件不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="定时发布">
          <el-switch 
            v-model="noticeForm.scheduled" 
            inline-prompt 
            active-text="开启" 
            inactive-text="关闭" 
          />
          <el-date-picker
            v-if="noticeForm.scheduled"
            v-model="noticeForm.scheduledTime"
            type="datetime"
            placeholder="选择定时发布时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="margin-left: 16px;"
            :disabled-date="disabledDate"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="noticeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNoticeForm" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 公告详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="公告详情"
      width="700px"
      destroy-on-close
    >
      <div class="notice-detail" v-if="currentNotice">
        <!-- 头部信息 -->
        <div class="detail-header">
          <h2>{{ currentNotice.title }}</h2>
          <div style="margin-top: 12px;">
            <el-tag :type="noticeTypeTag(currentNotice.type)" size="small">
              {{ noticeTypeText(currentNotice.type) }}
            </el-tag>
            <el-tag :type="noticeStatusTag(currentNotice.status)" size="small" style="margin-left: 8px;">
              {{ noticeStatusText(currentNotice.status) }}
            </el-tag>
            <el-tag :type="priorityTag(currentNotice.priority)" size="small" style="margin-left: 8px;">
              {{ priorityText(currentNotice.priority) }}
            </el-tag>
          </div>
        </div>

        <el-descriptions :column="2" border style="margin-top: 20px;">
          <el-descriptions-item label="发布者">{{ currentNotice.publisher }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ currentNotice.publishTime || '未发布' }}</el-descriptions-item>
          <el-descriptions-item label="浏览量">{{ currentNotice.viewCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentNotice.createTime }}</el-descriptions-item>
        </el-descriptions>

        <!-- 公告内容 -->
        <el-card shadow="never" class="detail-section" style="margin-top: 20px;">
          <template #header>
            <span><el-icon><Document /></el-icon> 公告内容</span>
          </template>
          <div class="notice-content" style="line-height: 1.8; white-space: pre-wrap;">
            {{ currentNotice.content }}
          </div>
        </el-card>

        <!-- 附件列表 -->
        <el-card shadow="never" class="detail-section" style="margin-top: 20px;" v-if="currentNotice.attachments?.length">
          <template #header>
            <span><el-icon><Link /></el-icon> 附件列表</span>
          </template>
          <div v-for="(file, idx) in currentNotice.attachments" :key="idx" class="attachment-item">
            <el-icon size="18" style="margin-right: 8px;"><Document /></el-icon>
            <span style="flex: 1;">{{ file.fileName }}</span>
            <el-link type="primary" :underline="false" @click="handleDownloadAttachment(file)">
              <el-icon><Download /></el-icon> 下载
            </el-link>
          </div>
        </el-card>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromDetail">编辑公告</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {onMounted, reactive, ref} from 'vue'
import {Check, Delete, Document, Download, Edit, Link, Plus, Upload, View} from '@element-plus/icons-vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {adminRequest, mainRequest} from '@/api'
import PageHeader from "@/components/admin/PageHeader.vue"
import {useAppStore} from "@/stores/app.js";

const appStore = useAppStore()
// 加载状态
const loading = ref(false)
const submitting = ref(false)
const detailLoading = ref(false)

// 统计卡片数据
const statistics = ref([
  { type: 'total', label: '全部公告', value: 0, icon: '📋' },
  { type: 'published', label: '已发布', value: 0, icon: '✅' },
  { type: 'draft', label: '草稿', value: 0, icon: '📝' },
  { type: 'archived', label: '已下架', value: 0, icon: '🗄️' }
])

const activeStat = ref('all')

// 搜索表单
const searchForm = reactive({
  keyword: '',
  type: '',
  status: '',
  publishDate: ''
})

// 表格数据
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(5)

// 公告对话框
const noticeDialogVisible = ref(false)
const noticeDialogTitle = ref('发布公告')
const noticeFormRef = ref()
const fileList = ref([])
const submittedSuccess = ref(false)
const noticeForm = reactive({
  id: '',
  title: '',
  content: '',
  type: 'system',
  status: 'draft',
  priority: 'normal',
  scheduled: false,
  expireTime: null,
  scheduledTime: null
})

const noticeFormRules = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { min: 3, max: 100, message: '标题长度在 3-100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { min: 10, max: 5000, message: '内容长度在 10-5000 个字符', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择公告类型', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }]
}

// 详情对话框
const detailDialogVisible = ref(false)
const currentNotice = ref(null)

// 辅助函数
const noticeTypeTag = (type) => {
  const map = { system: 'info', activity: 'success', maintenance: 'warning', other: 'info' }
  return map[type] || 'info'
}

const noticeTypeText = (type) => {
  const map = { system: '系统公告', activity: '活动通知', maintenance: '维护通知', other: '其他' }
  return map[type] || type
}

const noticeStatusTag = (status) => {
  const map = { published: 'success', draft: 'info', archived: 'info' }
  return map[status] || 'info'
}

const noticeStatusText = (status) => {
  const map = { published: '已发布', draft: '草稿', archived: '已下架' }
  return map[status] || status
}

const priorityTag = (priority) => {
  const map = { normal: 'info', important: 'warning', urgent: 'danger' }
  return map[priority] || 'info'
}

const priorityText = (priority) => {
  const map = { normal: '普通', important: '重要', urgent: '紧急' }
  return map[priority] || priority
}

const handleUploadSuccess = (response, file, fileList) => {
  // 将返回的附件信息添加到 fileList 中，并保存 id
  file.id = response.data.id
  file.url = response.data.url
  file.name = response.data.name
}
// ==================== API 调用 ====================

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const res = await adminRequest.get('/notices/statistics')
    statistics.value = statistics.value.map(stat => ({
      ...stat,
      value: res[stat.type] || 0
    }))
  } catch (error) {
    console.error(error)
  }
}

// 获取公告列表
const fetchNotices = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchForm.keyword || undefined,
      type: searchForm.type || undefined,
      status: searchForm.status || undefined,
      publishDate: searchForm.publishDate || undefined
    }
    const res = await adminRequest.get('/notices', { params })
// 假设 res.records 是你从后端拿到的数组
    tableData.value = res.records.map(item => ({
      ...item, // 保留原有的其他属性
      // 将 T 替换为空格
      scheduledTime: item.scheduledTime ? item.scheduledTime.replace('T', ' ') : null,
      expireTime: item.expireTime ? item.expireTime.replace('T', ' ') : null
    })) || [];

    total.value = res.total || 0
  } catch (error) {
    ElMessage.error('获取公告列表失败')
  } finally {
    loading.value = false
  }
}

// 获取公告详情
const fetchNoticeDetail = async (id) => {
  detailLoading.value = true
  try {
    currentNotice.value = await adminRequest.get(`/notices/${id}`)

  } catch (error) {
    ElMessage.error('获取公告详情失败')
  } finally {
    detailLoading.value = false
  }
}

// 修改 handleDialogClose
const handleDialogClose = async () => {
  // 如果是新增模式且未提交成功，则清理所有未关联附件
  if (!noticeForm.id && !submittedSuccess.value && fileList.value.length > 0) {
    for (const file of fileList.value) {
      if (file.id) {
        try {
          await mainRequest.delete(`/upload/notice/${file.id}`)
        } catch (e) {
          ElMessage.error(e||'删除附件失败')
        }
      }
    }
  }
  resetNoticeForm()
  noticeDialogVisible.value = false
}
// ==================== 事件处理 ====================

const handleStatClick = (stat) => {
  activeStat.value = stat.type
  if (stat.type === 'all') {
    searchForm.status = ''
  } else {
    searchForm.status = stat.type
  }
  handleSearch()
}

const handleSearch = () => {
  currentPage.value = 1
  fetchNotices()
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.type = ''
  searchForm.status = ''
  searchForm.publishDate = ''
  activeStat.value = 'all'
  handleSearch()
}

const handleAdd = () => {
  noticeDialogTitle.value = '发布公告'
  resetNoticeForm()
  noticeDialogVisible.value = true
}

const handleView = async (row) => {
  await fetchNoticeDetail(row.id)
  detailDialogVisible.value = true
}

const handleEdit = (row) => {
  noticeDialogTitle.value = '编辑公告'
  noticeForm.id = row.id
  noticeForm.title = row.title
  noticeForm.content = row.content
  noticeForm.type = row.type
  noticeForm.status = row.status
  noticeForm.priority = row.priority
  noticeForm.expireTime = row.expireTime
  noticeForm.scheduled = !!row.scheduledTime
  noticeForm.scheduledTime = row.scheduledTime || ''
  fileList.value = row.attachments?.map((att, idx) => ({
    uid: idx,
    id: att.id,
    name: att.fileName,
    url: att.fileUrl
  })) || []
  noticeDialogVisible.value = true
}

const handleEditFromDetail = () => {
  detailDialogVisible.value = false
  handleEdit(currentNotice.value)
}

const handlePublish = async (row) => {
  ElMessageBox.confirm(
    '确定要发布该公告吗？发布后所有用户都将看到此公告。',
    '确认发布',
    {
      confirmButtonText: '确认发布',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await adminRequest.post(`/notices/${row.id}/publish`)
      ElMessage.success('公告发布成功')
      await fetchNotices()
      await fetchStatistics()
    } catch (error) {
      ElMessage.error(error || '发布失败')
    }
  }).catch(() => {})
}

const handleArchive = async (row) => {
  ElMessageBox.confirm(
    '确定要下架该公告吗？下架后用户将无法看到此公告。',
    '确认下架',
    {
      confirmButtonText: '确认下架',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await adminRequest.post(`/notices/${row.id}/archive`)
      ElMessage.success('公告已下架')
      await fetchNotices()
      await fetchStatistics()
    } catch (error) {
      ElMessage.error(error || '下架失败')
    }
  }).catch(() => {})
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '您确定要删除该公告吗？此操作不可恢复。',
    '确认删除',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await adminRequest.delete(`/notices/${row.id}`)
      ElMessage.success('公告已删除')
      await fetchNotices()
      await fetchStatistics()
    } catch (error) {
      ElMessage.error(error || '删除失败')
    }
  }).catch(() => {})
}

const resetNoticeForm = () => {
  noticeForm.id = ''
  noticeForm.title = ''
  noticeForm.content = ''
  noticeForm.type = 'system'
  noticeForm.status = 'draft'
  noticeForm.priority = 'normal'
  noticeForm.expireTime = ''
  noticeForm.scheduled = false
  noticeForm.scheduledTime = ''
  fileList.value = []
  noticeFormRef.value?.clearValidate()
}

const submitNoticeForm = async () => {
  if (!noticeFormRef.value) return
  await noticeFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    submittedSuccess.value = false // 重置标志
    try {
      const payload = {
        title: noticeForm.title,
        content: noticeForm.content,
        type: noticeForm.type,
        status: noticeForm.status,
        priority: noticeForm.priority,
        expireTime: noticeForm.expireTime ? noticeForm.expireTime : null,
        scheduledTime: noticeForm.scheduled ? noticeForm.scheduledTime : null,
        attachmentIds: fileList.value.map(f => f.id).filter(Boolean)
      }

      if (noticeForm.id) {
        // 编辑
        await adminRequest.put(`/notices/${noticeForm.id}`, payload)
        ElMessage.success('公告更新成功')
      } else {
        // 新增
        payload.userId = appStore.userInfo.id
        await adminRequest.post('/notices', payload)
        ElMessage.success('公告发布成功')
      }
      submittedSuccess.value = true // 标记提交成功
      noticeDialogVisible.value = false
      await fetchNotices()
      await fetchStatistics()
    } catch (error) {
      ElMessage.error(error || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 处理文件变更（可选增强）
const handleFileChange = (file, fileList) => {
  // 过滤掉上传失败/已移除的文件，只保留有效列表
  fileList.value = fileList.filter(item => item.status !== 'fail' && !item.isRemoved);

  // 【可选】如果是同个文件重复上传，删除旧文件
  const sameNameFiles = fileList.value.filter(item =>
      item.name === file.name && item.uid !== file.uid
  );
  sameNameFiles.forEach(async (oldFile) => {
    if (oldFile.id) {
      try {
        await mainRequest.delete(`/upload/notice/${oldFile.id}`);
      } catch (e) {
        ElMessage.error(e||'清理重复文件失败')
      }
    }
    // 从列表中移除旧文件
    fileList.value = fileList.value.filter(item => item.uid !== oldFile.uid);
  });
};

// 处理文件移除（关键修改）
const handleFileRemove = async (file, fileList) => {
  fileList.value = fileList;
  // 如果文件已上传成功（有id），调用删除接口
  if (file.id) {
    try {
      await mainRequest.delete(`/upload/notice/${file.id}`);
      ElMessage.success(`已删除附件: ${file.name}`);
    } catch (e) {
      ElMessage.error(`删除附件失败: ${file.name}` || e);
    }
  }
};

const beforeFileUpload = (file) => {
  const validTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
  const isValidType = validTypes.includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isValidType) {
    ElMessage.error('只能上传 PDF、Word、Excel 格式的文件！')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB！')
    return false
  }
  return true
}

const handleDownloadAttachment = (file) => {
  window.open(file.fileUrl, '_blank')
}

const disabledDate = (time) => {
  return time.getTime() < Date.now()
}

// 分页事件
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchNotices()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchNotices()
}

// 初始化
onMounted(() => {
  fetchStatistics()
  fetchNotices()
})
</script>

<style scoped>
.notice-list {
  padding: 0;
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
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-icon--all {
  background: linear-gradient(135deg, #e8f1fc, #d0e3f7);
}

.stat-icon--published {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
}

.stat-icon--draft {
  background: linear-gradient(135deg, #fff3cd, #ffeeba);
}

.stat-icon--archived {
  background: linear-gradient(135deg, #d1ecf1, #bee5eb);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: bold;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

/* 详情对话框头部 */
.detail-header {
  padding: 20px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9), #f5f7fa);
  border-radius: 8px;
}

.detail-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--el-text-color-primary);
}

/* 详情部分 */
.detail-section {
  margin-top: 20px;
}

/* 附件列表 */
.attachment-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  margin-bottom: 8px;
}

.attachment-item:last-child {
  margin-bottom: 0;
}

/* 公告内容 */
.notice-content {
  font-size: 14px;
  color: var(--el-text-color-regular);
  padding: 16px 0;
}

/* 上传区域 */
.notice-upload :deep(.el-upload-list__item) {
  transition: all 0.2s;
}

.notice-upload :deep(.el-upload-list__item:hover) {
  transform: translateY(-2px);
}
</style>
