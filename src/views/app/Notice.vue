<template>
  <div class="user-notices">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>系统通知</h1>
      <p>了解校园租车平台的最新动态和重要公告</p>
    </div>

    <!-- 搜索筛选栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm" label-width="auto">
        <el-form-item label="关键词">
          <el-input
              v-model="searchForm.keyword"
              placeholder="搜索标题/内容"
              clearable
              style="width: 240px;"
              @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="公告类型">
          <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 140px;">
            <!-- ✅ 改成动态遍历 -->
            <el-option
                v-for="item in noticeTypeOptions"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 通知列表 -->
    <div class="notice-list" v-loading="loading">
      <el-empty v-if="total === 0 && !loading" description="暂无通知" />
      <div
          v-for="item in noticeList"
          :key="item.id"
          class="notice-item"
          @click="handleViewDetail(item.id)"
      >
        <div class="notice-header">
          <div class="notice-title">
            <el-tag :type="noticeTypeTag(item.type)" size="small" effect="plain">
              {{ noticeTypeText(item.type) }}
            </el-tag>
            <span class="title-text">{{ item.title }}</span>
            <el-tag
                v-if="item.priority === 'urgent'"
                type="danger"
                size="small"
                effect="dark"
                class="priority-tag"
            >
              紧急
            </el-tag>
            <el-tag
                v-else-if="item.priority === 'important'"
                type="warning"
                size="small"
                effect="dark"
                class="priority-tag"
            >
              重要
            </el-tag>
          </div>
          <div class="notice-meta">
            <el-tag>{{ item.status }}</el-tag>
            <span class="view-count">
              <el-icon><View /></el-icon> {{ item.viewCount }}
            </span>
            <span class="publish-time">
              <el-icon><Clock /></el-icon> {{ formatTime(item.publishTime) }}
            </span>
            <el-button
                type="danger"
                circle
                size="small"
                @click.stop="handleDeleted(item.id)"
            >
              <el-icon color="red"><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="notice-content">
          {{ item.content }}...
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
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
    </div>

    <!-- 通知详情弹窗 -->
    <el-dialog
        v-model="detailVisible"
        :title="currentNotice?.title"
        width="700px"
        destroy-on-close
        class="notice-detail-dialog"
    >
      <div v-if="currentNotice" class="notice-detail">
        <div class="detail-meta">
          <el-tag :type="noticeTypeTag(currentNotice.type)" size="small">
            {{ noticeTypeText(currentNotice.type) }}
          </el-tag>
          <el-tag
              v-if="currentNotice.priority === 'urgent'"
              type="danger"
              size="small"
              effect="dark"
          >
            紧急
          </el-tag>
          <el-tag
              v-else-if="currentNotice.priority === 'important'"
              type="warning"
              size="small"
              effect="dark"
          >
            重要
          </el-tag>
          <span class="publish-time">
            <el-icon><Clock /></el-icon> 发布时间：{{ formatTime(currentNotice.publishTime) }}
          </span>
          <span class="view-count">
            <el-icon><View /></el-icon> 浏览量：{{ currentNotice.viewCount }}
          </span>
        </div>
        <div class="notice-content" v-html="currentNotice.content"></div>

        <!-- 附件列表 -->
        <div v-if="currentNotice.noticeAttachments && currentNotice.noticeAttachments.length > 0" class="detail-attachments">
          <div class="attachments-title">附件下载</div>
          <div v-for="file in currentNotice.noticeAttachments" :key="file.id" class="attachment-item">
            <el-icon><Paperclip /></el-icon>
            <span class="file-name">{{ file.fileName }}</span>
            <el-link type="primary" :underline="false" @click="downloadAttachment(file.fileUrl)">
              下载
            </el-link>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false;fetchNotices()">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {onMounted, reactive, ref} from 'vue'
import {ElMessage} from 'element-plus'
import {Clock, Delete, Paperclip, View} from '@element-plus/icons-vue'
import {mainRequest} from '@/api'
import {useAppStore} from "@/stores/app.js";

const appStore = useAppStore()
// 列表数据
const noticeList = ref([])
const total = ref(0)
const loading = ref(false)
const renderedHtml = ref('')
// 搜索表单
const searchForm = reactive({
  keyword: '',
  type: ''
})

// 分页参数
const currentPage = ref(1)
const pageSize = ref(10)

// 详情弹窗
const detailVisible = ref(false)
const currentNotice = ref(null)

// 辅助函数
const noticeTypeTag = (type) => {
  const map = { system: 'info', activity: 'success', maintenance: 'warning', other: 'info' }
  return map[type] || 'info'
}

const noticeTypeOptions = ref([])

// 获取文本的方法变成了优雅的一行代码：
const noticeTypeText = (value) => {
  return noticeTypeOptions.value.find(item => item.dictValue === value)?.dictLabel || value
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  // 一天内显示相对时间
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    if (hours < 1) {
      const minutes = Math.floor(diff / (60 * 1000))
      return `${minutes}分钟前`
    }
    return `${hours}小时前`
  }
  // 否则显示具体日期
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 获取通知列表
const fetchNotices = async () => {
  loading.value = true
  try {
    const params = {
      id: appStore.userInfo.id,
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchForm.keyword || undefined,
      type: searchForm.type || undefined
    }
    const res = await mainRequest.get('/notices', { params })
    noticeList.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    ElMessage.error(error||'加载通知失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 查看详情
const handleViewDetail = async (id) => {
  try {
    currentNotice.value = await mainRequest.get(`/notices/${id}`)
    detailVisible.value = true
    await mainRequest.put(`/notices/${id}`, null, {
      params : {
        userId: appStore.userInfo.id
      }
    })
  } catch (error) {
    ElMessage.error(error || '获取详情失败')
  }
}

const handleDeleted = async (id) => {
  try {
    // 增加确认步骤
    await ElMessageBox.confirm('确定要删除该通知吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // 使用反引号
    await mainRequest.delete(`/notices/${id}`, {
      params: { userId: appStore.userInfo.id }
    })

    ElMessage.success("删除成功")
    await fetchNotices() // 刷新列表

  } catch (e) {
    ElMessage.error('删除失败')
  }
}

// 下载附件
const downloadAttachment = (url) => {
  window.open(url, '_blank')
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchNotices()
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.type = ''
  handleSearch()
}

// 分页
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
  fetchNotices();
})
</script>

<style scoped>
/* ========== 布局特有样式（保留） ========== */

.user-notices {
  max-width: 1200px;
  margin: 80px auto 0;
  padding: 20px;
  min-height: 500px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;
}

.page-header p {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.search-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.notice-list {
  background: var(--el-bg-color);
  border-radius: 12px;
  overflow: hidden;
}

.notice-item {
  padding: 20px 24px;
  border-bottom: 1px solid var(--el-border-color-light);
  cursor: pointer;
  transition: all 0.2s;
}

.notice-item:hover {
  background-color: var(--el-fill-color-light);
  transform: translateX(4px);
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.title-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.priority-tag {
  margin-left: 8px;
}

.notice-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.notice-meta .el-icon {
  margin-right: 4px;
  vertical-align: middle;
}

.notice-content {
  color: var(--el-text-color-regular);
  line-height: 1.6;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: var(--el-bg-color);
}

/* 详情弹窗样式 */
.notice-detail {
  padding: 8px 0;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  margin-bottom: 20px;
}

.detail-meta .publish-time,
.detail-meta .view-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.detail-content {
  line-height: 1.8;
  font-size: 15px;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  margin-bottom: 24px;
}

.detail-attachments {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-light);
}

.attachments-title {
  font-weight: 500;
  margin-bottom: 12px;
  font-size: 14px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  margin-bottom: 8px;
}

.attachment-item .file-name {
  flex: 1;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

/* 响应式 */
@media (max-width: 768px) {
  .user-notices {
    padding: 12px;
  }

  .notice-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .notice-meta {
    width: 100%;
    justify-content: flex-start;
  }

  .notice-item {
    padding: 16px;
  }
}
</style>