<template>
  <div class="service-list">
    <page-header title="服务管理" description="管理增值服务项目，如上架/下架、定价等">
      <el-button type="primary" @click="handleAdd">
        <el-icon>
          <Plus/>
        </el-icon>
        新增服务
      </el-button>
    </page-header>

    <!-- 搜索区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <el-form :inline="true" :model="searchForm" label-width="auto">
        <el-form-item label="服务名称">
          <el-input v-model="searchForm.name" placeholder="服务名称" clearable @keyup.enter="handleSearch"/>
        </el-form-item>
        <el-form-item label="服务类型">
          <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 140px;">
            <el-option label="保险" value="insurance"/>
            <el-option label="儿童座椅" value="child_seat"/>
            <el-option label="车载Wi-Fi" value="wifi"/>
            <el-option label="其他" value="other"/>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 140px;">
            <el-option label="上架" :value="1"/>
            <el-option label="下架" :value="0"/>
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
          <span><el-icon><Goods/></el-icon> 服务列表</span>
          <el-tag type="info" size="small">共 {{ total }} 条记录</el-tag>
        </div>
      </template>

      <el-table :data="tableData" border stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="服务名称" min-width="150"/>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip/>
        <el-table-column prop="price" label="单价 (元/天)" width="120">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">{{ formatType(row.type) }}</template>
        </el-table-column>
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
        <el-table-column label="操作" width="180" fixed="right">
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
        width="500px"
        destroy-on-close
        @close="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" :disabled="dialogMode === 'view'">
        <el-form-item label="服务名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入服务名称"/>
        </el-form-item>
        <el-form-item label="服务类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择" style="width: 100%;">
            <el-option label="保险" value="insurance"/>
            <el-option label="儿童座椅" value="child_seat"/>
            <el-option label="车载Wi-Fi" value="wifi"/>
            <el-option label="其他" value="other"/>
          </el-select>
        </el-form-item>
        <el-form-item label="单价" prop="price">
          <el-input-number v-model="formData.price" :min="0" :precision="2" :step="5" style="width: 100%;"/>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
              v-model="formData.status"
              :active-value="1"
              :inactive-value="0"
              inline-prompt
              active-text="上架"
              inactive-text="下架"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" rows="3" placeholder="请输入服务描述"/>
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
import {Plus, Goods, View, Edit, Delete} from '@element-plus/icons-vue'
import {adminRequest} from '@/api'
import PageHeader from "@/components/admin/PageHeader.vue";

// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '',
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
const dialogTitle = ref('新增服务')
const formRef = ref(null)
const formData = reactive({
  id: null,
  name: '',
  type: '',
  price: 0,
  status: 1,
  description: ''
})

// 表单校验规则
const rules = {
  name: [{required: true, message: '请输入服务名称', trigger: 'blur'}],
  type: [{required: true, message: '请选择服务类型', trigger: 'change'}],
  price: [{required: true, message: '请输入单价', trigger: 'blur'}]
}

// 格式化类型显示
const formatType = (type) => {
  const map = {
    insurance: '保险',
    child_seat: '儿童座椅',
    wifi: '车载Wi-Fi',
    other: '其他'
  }
  return map[type] || type
}

// 获取服务列表
const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      name: searchForm.name || undefined,
      type: searchForm.type || undefined,
      status: searchForm.status !== '' ? searchForm.status : undefined
    }
    const res = await adminRequest.get('/services', {params})
    // 为每行添加状态加载标记（用于开关loading）
    tableData.value = res.records.map(item => ({...item, statusLoading: false}))
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取服务列表失败')
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
  searchForm.name = ''
  searchForm.type = ''
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
  formData.type = ''
  formData.price = 0
  formData.status = 1
  formData.description = ''
}

// 新增
const handleAdd = () => {
  dialogMode.value = 'add'
  dialogTitle.value = '新增服务'
  resetForm()
  dialogVisible.value = true
}

// 查看
const handleView = (row) => {
  dialogMode.value = 'view'
  dialogTitle.value = '查看服务'
  formData.id = row.id
  formData.name = row.name
  formData.type = row.type
  formData.price = row.price
  formData.status = row.status
  formData.description = row.description
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogMode.value = 'edit'
  dialogTitle.value = '编辑服务'
  formData.id = row.id
  formData.name = row.name
  formData.type = row.type
  formData.price = row.price
  formData.status = row.status
  formData.description = row.description
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
        type: formData.type,
        price: formData.price,
        status: formData.status,
        description: formData.description
      }
      if (dialogMode.value === 'add') {
        await adminRequest.post('/services', payload)
        ElMessage.success('新增成功')
      } else {
        await adminRequest.put(`/services/${formData.id}`, payload)
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
      `确定要删除服务 “${row.name}” 吗？`,
      '删除确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
  ).then(async () => {
    try {
      await adminRequest.delete(`/services/${row.id}`)
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
    await adminRequest.put(`/services/${row.id}/status`, null, {
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
.service-list {
  padding: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--el-text-color-primary);
}
</style>