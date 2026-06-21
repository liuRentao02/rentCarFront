<template>
  <div class="review-manage">
    <page-header title="评论管理" description="管理用户对车辆的评论，可隐藏、删除违规评论">
      <template #default>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
          <el-icon>
            <Delete/>
          </el-icon>
          批量删除
        </el-button>
        <el-button type="warning" :disabled="selectedRows.length === 0" @click="handleBatchHide">
          <el-icon>
            <Hide/>
          </el-icon>
          批量隐藏
        </el-button>
        <el-button type="success" :disabled="selectedRows.length === 0" @click="handleBatchShow">
          <el-icon>
            <View/>
          </el-icon>
          批量显示
        </el-button>
      </template>
    </page-header>

    <!-- 筛选区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <el-form :inline="true" :model="searchForm" label-width="auto">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="车辆名称 / 评论内容 / 用户名" clearable
                    style="width: 240px;"/>
        </el-form-item>
        <el-form-item label="星级评分">
          <el-select v-model="searchForm.rating" placeholder="全部" clearable style="width: 120px;">
            <el-option v-for="i in 5" :key="i" :label="i + '星'" :value="i"/>
          </el-select>
        </el-form-item>
        <el-form-item label="评论状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px;">
            <el-option label="显示" :value="1"/>
            <el-option label="隐藏" :value="0"/>
          </el-select>
        </el-form-item>
        <el-form-item label="评论类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 140px;">
            <el-option label="汽车评论" value="car"/>
            <el-option label="非机动车评论" value="noncar"/>
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 380px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span><el-icon><ChatLineSquare/></el-icon> 评论列表</span>
          <el-tag type="info">共 {{ total }} 条记录</el-tag>
        </div>
      </template>

      <el-table
          :data="tableData"
          border
          stripe
          v-loading="loading"
          @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"/>
        <el-table-column prop="id" label="评论ID" width="80"/>
        <el-table-column prop="vehicleInfo" label="关联车辆" min-width="150"/>
        <el-table-column prop="userName" label="评论用户" width="120"/>
        <el-table-column label="星级评分" width="100">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled :colors="['#F7BA2A','#F7BA2A','#F7BA2A']"/>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评论内容" min-width="180" show-overflow-tooltip/>
        <el-table-column label="评论图片" width="80">
          <template #default="{ row }">
            <el-image
                v-if="row.hasImage"
                :src="row.images?.split(',')[0]"
                :preview-src-list="row.images?.split(',')"
                fit="cover"
                :preview-teleported="true"
                style="width: 50px; height: 50px; border-radius: 4px; cursor: pointer;"
            />
            <span v-else>无</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="评论时间" width="160"/>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
                v-model="row.status"
                :active-value="1"
                :inactive-value="0"
                @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" :icon="View" circle size="small" @click="handleView(row)" title="详情"/>
            <el-button type="danger" :icon="Delete" circle size="small" @click="handleDelete(row)" title="删除"/>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; display: flex; justify-content: center;">
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="fetchList"
            @current-change="fetchList"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="评论详情" width="700px" destroy-on-close>
      <div v-if="currentDetail" v-loading="detailLoading">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="评论ID">{{ currentDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="关联车辆">{{ currentDetail.vehicleInfo }}</el-descriptions-item>
          <el-descriptions-item label="评论用户">{{ currentDetail.userName }}（{{
              currentDetail.userPhone
            }}）
          </el-descriptions-item>
          <el-descriptions-item label="星级评分">
            <el-rate v-model="currentDetail.rating" disabled/>
          </el-descriptions-item>
          <el-descriptions-item label="评论时间">{{ currentDetail.createTime }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="currentDetail.status === 1 ? 'success' : 'danger'">
              {{ currentDetail.status === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="关联订单">
            <el-link type="primary" @click="goToOrder(currentDetail.orderId)">{{ currentDetail.orderNo }}</el-link>
          </el-descriptions-item>
          <el-descriptions-item label="点赞数">{{ currentDetail.likesCount }}</el-descriptions-item>
          <el-descriptions-item label="评论数">{{ currentDetail.commentsCount }}</el-descriptions-item>
          <el-descriptions-item label="评论内容" :span="2">
            <div style="white-space: pre-wrap;">{{ currentDetail.content }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="配图" :span="2" v-if="currentDetail.imageUrls?.length">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <el-image
                  v-for="(url, idx) in currentDetail.imageUrls"
                  :key="idx"
                  :src="url"
                  :preview-src-list="currentDetail.imageUrls"
                  style="width: 100px; height: 100px; border-radius: 4px;"
                  fit="cover"
              />
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
            v-if="currentDetail?.status === 0"
            type="success"
            @click="toggleStatus(currentDetail.id, 1)"
        >显示评论
        </el-button>
        <el-button
            v-if="currentDetail?.status === 1"
            type="warning"
            @click="toggleStatus(currentDetail.id, 0)"
        >隐藏评论
        </el-button>
        <el-button type="danger" @click="deleteFromDetail">删除评论</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted, computed, watch} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {Delete, View, Document, ChatLineSquare, Hide} from '@element-plus/icons-vue'
import {adminRequest} from '@/api'
import PageHeader from '@/components/admin/PageHeader.vue'
import {useRouter} from 'vue-router'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  keyword: '',
  rating: null,
  status: null,
  type: '',
  startTime: '',
  endTime: ''
})
const dateRange = ref([])
watch(dateRange, (val) => {
  if (val && val.length === 2) {
    searchForm.startTime = val[0]
    searchForm.endTime = val[1]
  } else {
    searchForm.startTime = ''
    searchForm.endTime = ''
  }
})

// 表格数据
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const selectedRows = ref([])

// 详情弹窗
const detailVisible = ref(false)
const currentDetail = ref(null)
const detailLoading = ref(false)

// 获取列表
const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      ...searchForm
    }
    // 过滤空值
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === '') delete params[key]
    })
    const res = await adminRequest.get('/reviews', {params})
    tableData.value = res.records
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取评论列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchList()
}

// 重置
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.rating = null
  searchForm.status = null
  searchForm.type = ''
  dateRange.value = []
  handleSearch()
}

// 表格选中变化
const handleSelectionChange = (val) => {
  selectedRows.value = val
}

// 修改单条状态
const handleStatusChange = async (row) => {
  try {
    await adminRequest.put('/reviews/status', {id: row.id, status: row.status})
    ElMessage.success('状态已更新')
  } catch (error) {
    // 回滚状态
    row.status = row.status === 1 ? 0 : 1
    ElMessage.error('状态更新失败')
  }
}

// 查看详情
const handleView = async (row) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await adminRequest.get(`/reviews/${row.id}`)
    currentDetail.value = res
  } catch (error) {
    ElMessage.error('获取详情失败')
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

// 查看关联订单
const handleViewOrder = (row) => {
  if (row.orderId) {
    router.push(`/admin/order/detail/${row.orderId}`) // 根据实际订单详情路由调整
  } else {
    ElMessage.warning('该评论未关联订单')
  }
}

// 单条删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除评论ID ${row.id} 吗？`, '提示', {type: 'warning'})
      .then(async () => {
        await adminRequest.delete(`/reviews/${row.id}`)
        ElMessage.success('删除成功')
        fetchList()
      })
      .catch(() => {
      })
}

// 从详情弹窗删除
const deleteFromDetail = async () => {
  if (!currentDetail.value) return
  ElMessageBox.confirm(`确定删除评论ID ${currentDetail.value.id} 吗？`, '提示', {type: 'warning'})
      .then(async () => {
        await adminRequest.delete(`/reviews/${currentDetail.value.id}`)
        ElMessage.success('删除成功')
        detailVisible.value = false
        fetchList()
      })
      .catch(() => {
      })
}

// 批量删除
const handleBatchDelete = () => {
  const ids = selectedRows.value.map(r => r.id)
  if (ids.length === 0) return
  ElMessageBox.confirm(`确定删除选中的 ${ids.length} 条评论吗？`, '批量删除', {type: 'warning'})
      .then(async () => {
        await adminRequest.delete('/reviews/batch', {data: {ids}})
        ElMessage.success('批量删除成功')
        fetchList()
      })
      .catch(() => {
      })
}

// 批量隐藏
const handleBatchHide = () => {
  const ids = selectedRows.value.map(r => r.id)
  if (ids.length === 0) return
  ElMessageBox.confirm(`确定隐藏选中的 ${ids.length} 条评论吗？`, '批量隐藏', {type: 'warning'})
      .then(async () => {
        await adminRequest.put('/reviews/batch-status', {ids, status: 0})
        ElMessage.success('批量隐藏成功')
        fetchList()
      })
      .catch(() => {
      })
}

// 批量显示
const handleBatchShow = () => {
  const ids = selectedRows.value.map(r => r.id)
  if (ids.length === 0) return
  ElMessageBox.confirm(`确定显示选中的 ${ids.length} 条评论吗？`, '批量显示', {type: 'warning'})
      .then(async () => {
        await adminRequest.put('/reviews/batch-status', {ids, status: 1})
        ElMessage.success('批量显示成功')
        fetchList()
      })
      .catch(() => {
      })
}

// 详情中切换状态
const toggleStatus = async (id, status) => {
  try {
    await adminRequest.put('/reviews/status', {id, status})
    ElMessage.success(status === 1 ? '评论已显示' : '评论已隐藏')
    if (detailVisible.value) {
      currentDetail.value.status = status
    }
    fetchList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 跳转订单详情（需根据实际路由调整）
const goToOrder = (orderId) => {
  router.push(`/admin/order/list?orderId=${orderId}`)
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.review-manage {
  padding: 0;
}
</style>