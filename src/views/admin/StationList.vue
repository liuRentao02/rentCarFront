<template>
  <div class="station-list">
    <page-header title="网点管理" description="管理取还车网点信息，支持地图定位">
      <el-button type="primary" @click="handleAdd">
        <el-icon>
          <Plus/>
        </el-icon>
        新增网点
      </el-button>
    </page-header>

    <!-- 搜索区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <el-form :inline="true" :model="searchForm" label-width="auto">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="网点名称/地址" clearable @keyup.enter="handleSearch"/>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 140px;">
            <el-option label="营业中" :value="1"/>
            <el-option label="关闭" :value="0"/>
          </el-select>
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
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span><el-icon><Location/></el-icon> 网点列表</span>
          <el-tag type="info" size="small">共 {{ total }} 条记录</el-tag>
        </div>
      </template>

      <el-table :data="tableData" border stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="网点名称" min-width="150"/>
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip/>
        <el-table-column prop="contactPhone" label="联系电话" width="130"/>
        <el-table-column prop="businessHours" label="营业时间" width="150"/>
        <el-table-column prop="sortOrder" label="排序" width="80"/>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
                v-model="row.status"
                :active-value="1"
                :inactive-value="0"
                @change="handleStatusChange(row)"
                :loading="row.statusLoading"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" :icon="View" circle size="small" @click="handleView(row)"/>
            <el-button type="warning" :icon="Edit" circle size="small" @click="handleEdit(row)"/>
            <el-button type="danger" :icon="Delete" circle size="small" @click="handleDelete(row)"/>
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

    <!-- 新增/编辑/查看对话框 -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="600px"
        destroy-on-close
        @close="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" :disabled="dialogMode === 'view'">
        <el-form-item label="网点名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入网点名称"/>
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="formData.address" placeholder="请输入详细地址"/>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="纬度" prop="latitude">
              <el-input-number v-model="formData.latitude" :precision="8" :step="0.0001" style="width: 100%;"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经度" prop="longitude">
              <el-input-number v-model="formData.longitude" :precision="8" :step="0.0001" style="width: 100%;"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="formData.contactPhone" placeholder="请输入联系电话"/>
        </el-form-item>
        <el-form-item label="营业时间" prop="businessHours">
          <el-input v-model="formData.businessHours" placeholder="例如：08:00-22:00"/>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" style="width: 100%;"/>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
              v-model="formData.status"
              :active-value="1"
              :inactive-value="0"
              inline-prompt
              active-text="营业中"
              inactive-text="关闭"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="dialogMode !== 'view'" type="primary" @click="submitForm" :loading="submitting">保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {Plus, Location, View, Edit, Delete} from '@element-plus/icons-vue'
import {adminRequest} from '@/api'
import PageHeader from "@/components/admin/PageHeader.vue";

// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: ''
})

// 表格数据
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框
const dialogVisible = ref(false)
const dialogMode = ref('add') // 'add', 'edit', 'view'
const dialogTitle = ref('新增网点')
const formRef = ref(null)
const formData = reactive({
  id: null,
  name: '',
  address: '',
  latitude: null,
  longitude: null,
  contactPhone: '',
  businessHours: '',
  sortOrder: 0,
  status: 1
})

// 表单校验规则
const rules = {
  name: [{required: true, message: '请输入网点名称', trigger: 'blur'}],
  address: [{required: true, message: '请输入地址', trigger: 'blur'}]
}

// 获取网点列表
const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status !== '' ? searchForm.status : undefined
    }
    const res = await adminRequest.get('/stations', {params})
    // 为每行添加状态加载标记
    tableData.value = res.records.map(item => ({...item, statusLoading: false}))
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取网点列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  handleSearch()
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchList()
}
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchList()
}

// 重置表单
const resetForm = () => {
  formRef.value?.clearValidate()
  formData.id = null
  formData.name = ''
  formData.address = ''
  formData.latitude = null
  formData.longitude = null
  formData.contactPhone = ''
  formData.businessHours = ''
  formData.sortOrder = 0
  formData.status = 1
}

// 新增
const handleAdd = () => {
  dialogMode.value = 'add'
  dialogTitle.value = '新增网点'
  resetForm()
  dialogVisible.value = true
}

// 查看
const handleView = (row) => {
  dialogMode.value = 'view'
  dialogTitle.value = '查看网点'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogMode.value = 'edit'
  dialogTitle.value = '编辑网点'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        contactPhone: formData.contactPhone,
        businessHours: formData.businessHours,
        sortOrder: formData.sortOrder,
        status: formData.status
      }
      if (dialogMode.value === 'add') {
        await adminRequest.post('/stations', payload)
        ElMessage.success('新增成功')
      } else {
        await adminRequest.put(`/stations/${formData.id}`, payload)
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
      await fetchList()
    } catch (error) {
      ElMessage.error(error || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
      `确定要删除网点 “${row.name}” 吗？`,
      '删除确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
  ).then(async () => {
    try {
      await adminRequest.delete(`/stations/${row.id}`)
      ElMessage.success('删除成功')
      await fetchList()
    } catch (error) {
      ElMessage.error(error || '删除失败')
    }
  }).catch(() => {
  })
}

// 状态切换
const handleStatusChange = async (row) => {
  row.statusLoading = true
  try {
    await adminRequest.put(`/stations/${row.id}/status`, null, {
      params: {status: row.status}
    })
    ElMessage.success('状态更新成功')
  } catch (error) {
    // 失败时回滚状态
    row.status = row.status === 1 ? 0 : 1
    ElMessage.error(error || '状态更新失败')
  } finally {
    row.statusLoading = false
  }
}

// 初始化
onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.station-list {
  padding: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--el-text-color-primary);
}
</style>