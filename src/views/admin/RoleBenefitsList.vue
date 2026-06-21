<template>
  <div class="role-benefits-list">
    <page-header title="角色权益管理" description="配置不同会员等级的押金比例、租金折扣等权益">
      <el-button type="primary" @click="handleAdd">
        <el-icon>
          <Plus/>
        </el-icon>
        新增权益
      </el-button>
    </page-header>

    <!-- 搜索区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <el-form :inline="true" :model="searchForm" label-width="auto">
        <el-form-item label="角色名称">
          <el-input v-model="searchForm.role" placeholder="角色标识" clearable @keyup.enter="handleSearch"/>
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
          <span><el-icon><SetUp/></el-icon> 角色权益列表</span>
          <el-tag type="info" size="small">共 {{ total }} 条记录</el-tag>
        </div>
      </template>

      <el-table :data="tableData" border stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="role" label="角色标识" width="120">
          <template #default="{ row }">
            <el-tag :type="roleTag(row.role)" size="small">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="depositRate" label="押金比例" width="100">
          <template #default="{ row }">{{ (row.depositRate * 100).toFixed(0) }}%</template>
        </el-table-column>
        <el-table-column prop="rentDiscount" label="租金折扣" width="100">
          <template #default="{ row }">{{ (row.rentDiscount * 100).toFixed(0) }}%</template>
        </el-table-column>
        <el-table-column prop="freeExtensionCount" label="延长次数" width="120"/>
        <el-table-column prop="overdueFeeRate" label="超时费率系数" width="120">
          <template #default="{ row }">{{ row.overdueFeeRate }} 倍</template>
        </el-table-column>
        <el-table-column prop="pointsThreshold" label="积分阈值" width="120">
          <template #default="{ row }">{{ row.pointsThreshold === -1 ? '无' : row.pointsThreshold }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip/>
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
        width="500px"
        destroy-on-close
        @close="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" :disabled="dialogMode === 'view'">
        <el-form-item label="角色标识" prop="role">
          <el-input v-model="formData.role" placeholder="如student" :disabled="dialogMode === 'edit'"/>
        </el-form-item>
        <el-form-item label="押金比例 (%)" prop="depositRate">
          <el-input-number v-model="formData.depositRate" :min="0" :max="100" :step="5" style="width: 100%;"/>
          <div class="form-hint">输入0表示免押金，100表示全额押金</div>
        </el-form-item>
        <el-form-item label="租金折扣 (%)" prop="rentDiscount">
          <el-input-number v-model="formData.rentDiscount" :min="0" :max="100" :step="5" style="width: 100%;"/>
          <div class="form-hint">输入85表示85折（优惠15%），100表示无折扣</div>
        </el-form-item>
        <el-form-item label="免费延长次数" prop="freeExtensionCount">
          <el-input-number v-model="formData.freeExtensionCount" :min="0" style="width: 100%;"/>
        </el-form-item>
        <el-form-item label="超时费率系数" prop="overdueFeeRate">
          <el-input-number v-model="formData.overdueFeeRate" :min="1" :step="0.1" :precision="1" style="width: 100%;"/>
          <div class="form-hint">例如 1.5 表示1.5倍标准超时费</div>
        </el-form-item>
        <el-form-item label="积分阈值" prop="pointsThreshold">
          <el-input-number v-model="formData.pointsThreshold" :min="-1" style="width: 100%;" />
          <div class="form-hint">达到该积分可自动升级到此角色，-1表示不适用</div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" rows="3" placeholder="请输入角色权益描述"/>
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
import {Plus, SetUp, View, Edit, Delete} from '@element-plus/icons-vue'
import {adminRequest} from '@/api'
import PageHeader from "@/components/admin/PageHeader.vue";

// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 搜索表单
const searchForm = reactive({
  role: ''
})

// 表格数据
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框
const dialogVisible = ref(false)
const dialogMode = ref('add') // 'add', 'edit', 'view'
const dialogTitle = ref('新增权益')
const formRef = ref(null)
const formData = reactive({
  id: null,
  role: '',
  depositRate: 100,     // 默认100%押金
  rentDiscount: 100,    // 默认无折扣
  freeExtensionCount: 0,
  pointsThreshold: -1,
  overdueFeeRate: 1.0,
  description: ''
})

// 表单校验规则
const rules = {
  role: [{required: true, message: '请输入角色标识', trigger: 'blur'}],
  depositRate: [{required: true, message: '请输入押金比例', trigger: 'blur'}],
  rentDiscount: [{required: true, message: '请输入租金折扣', trigger: 'blur'}],
  overdueFeeRate: [{required: true, message: '请输入超时费率系数', trigger: 'blur'}]
}

// 角色标签样式
const roleTag = (role) => {
  const map = {admin: 'danger', student: 'success', ordinary: 'info'}
  return map[role] || 'info'
}

// 获取列表
const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      role: searchForm.role || undefined
    }
    const res = await adminRequest.get('/role-benefits', {params})
    console.log(res)
    tableData.value = res.records
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取列表失败')
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
  searchForm.role = ''
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
  formData.role = ''
  formData.depositRate = 100
  formData.rentDiscount = 100
  formData.freeExtensionCount = 0
  formData.overdueFeeRate = 1.0
  formData.description = ''
}

// 新增
const handleAdd = () => {
  dialogMode.value = 'add'
  dialogTitle.value = '新增权益'
  resetForm()
  dialogVisible.value = true
}

// 查看
const handleView = (row) => {
  dialogMode.value = 'view'
  dialogTitle.value = '查看权益'
  Object.assign(formData, {
    id: row.id,
    role: row.role,
    depositRate: row.depositRate * 100,
    rentDiscount: row.rentDiscount * 100,
    freeExtensionCount: row.freeExtensionCount,
    overdueFeeRate: row.overdueFeeRate,
    description: row.description
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogMode.value = 'edit'
  dialogTitle.value = '编辑权益'
  Object.assign(formData, {
    id: row.id,
    role: row.role,
    depositRate: row.depositRate * 100,
    rentDiscount: row.rentDiscount * 100,
    freeExtensionCount: row.freeExtensionCount,
    overdueFeeRate: row.overdueFeeRate,
    description: row.description
  })
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
        role: formData.role,
        depositRate: formData.depositRate / 100,      // 转换为小数
        rentDiscount: formData.rentDiscount / 100,
        freeExtensionCount: formData.freeExtensionCount,
        pointsThreshold: formData.pointsThreshold,
        overdueFeeRate: formData.overdueFeeRate,
        description: formData.description
      }
      if (dialogMode.value === 'add') {
        await adminRequest.post('/role-benefits', payload)
        ElMessage.success('新增成功')
      } else {
        await adminRequest.put(`/role-benefits/${formData.id}`, payload)
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
      `确定要删除角色 “${row.role}” 的权益配置吗？`,
      '删除确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
  ).then(async () => {
    try {
      await adminRequest.delete(`/role-benefits/${row.id}`)
      ElMessage.success('删除成功')
      await fetchList()
    } catch (error) {
      ElMessage.error(error || '删除失败')
    }
  }).catch(() => {
  })
}

// 初始化
onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.role-benefits-list {
  padding: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--el-text-color-primary);
}

.form-hint {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>