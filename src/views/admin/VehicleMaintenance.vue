<template>
  <div class="vehicle-maintenance">
    <page-header title="维修记录" description="管理车辆的维修、保养及故障处理记录">
      <el-button type="primary" @click="handleAdd">
        <el-icon>
          <Plus/>
        </el-icon>
        新增维修记录
      </el-button>
    </page-header>

    <!-- 搜索筛选区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <el-form :inline="true" :model="searchForm" label-width="auto">
        <el-form-item label="车牌号">
          <el-input v-model="searchForm.plate" placeholder="如：京A·88888" clearable/>
        </el-form-item>
        <el-form-item label="维修状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 140px;">
            <el-option label="进行中" value="ongoing"/>
            <el-option label="已完成" value="completed"/>
            <el-option label="待处理" value="pending"/>
          </el-select>
        </el-form-item>
        <el-form-item label="维修日期起">
          <el-date-picker
              v-model="searchForm.dateStart"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="维修日期止">
          <el-date-picker
              v-model="searchForm.dateEnd"
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
          <span><el-icon><Tools/></el-icon> 维修记录列表</span>
          <el-tag type="info" size="small">共 {{ total }} 条记录</el-tag>
        </div>
      </template>

      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column label="车辆信息" min-width="150">
          <template #default="{ row }">
            <div>
              <div class="vehicle-plate">{{ row.plate }}</div>
              <div class="vehicle-model">{{ row.model }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceItem" label="维修项目" min-width="200"/>
        <el-table-column label="维修费用" width="120">
          <template #default="{ row }">
            <span>¥{{ row.cost }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceDate" label="维修日期" width="120"/>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small" effect="light">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
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
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑/查看维修记录对话框 -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="600px"
        destroy-on-close
        @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px"
               :disabled="dialogTitle === '查看维修记录'">
        <el-form-item label="选择车辆" prop="vehicleId">
          <el-select v-model="form.vehicleId" placeholder="请选择车牌" style="width: 100%;">
            <el-option
                v-for="item in vehicleOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="维修日期" prop="date">
          <el-date-picker
              v-model="form.date"
              type="date"
              placeholder="选择维修日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="维修项目" prop="item">
          <el-input v-model="form.item" placeholder="例如：更换机油、刹车保养"/>
        </el-form-item>
        <el-form-item label="维修费用" prop="cost">
          <el-input-number
              v-model="form.cost"
              :min="0"
              :precision="2"
              :step="10"
              style="width: 100%;"
              placeholder="请输入费用"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择" style="width: 100%;">
            <el-option label="进行中" value="ongoing"/>
            <el-option label="已完成" value="completed"/>
            <el-option label="待处理" value="pending"/>
          </el-select>
        </el-form-item>
        <el-form-item label="备注说明" prop="desc">
          <el-input v-model="form.desc" type="textarea" :rows="3" placeholder="额外说明（如维修厂、故障原因等）"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="dialogTitle !== '查看维修记录'" type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
        v-model="deleteDialogVisible"
        title="确认删除"
        width="400px"
        center
    >
      <div style="text-align: center; padding: 20px;">
        <el-icon :size="40" color="#F56C6C" style="margin-bottom: 16px;">
          <WarningFilled/>
        </el-icon>
        <h3>确认删除</h3>
        <p style="color: #909399;">您确定要删除该维修记录吗？此操作无法撤销。</p>
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted} from 'vue'
import {
  Plus, Tools, View, Edit, Delete, WarningFilled
} from '@element-plus/icons-vue'
import {ElMessage} from 'element-plus'
import {adminRequest} from '@/api'
import PageHeader from "@/components/admin/PageHeader.vue";

// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 搜索表单
const searchForm = reactive({
  plate: '',
  status: '',
  dateStart: '',
  dateEnd: ''
})

// 车辆选项数据
const vehicleOptions = ref([])

// 表格数据
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(5)

// 对话框
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const dialogTitle = ref('新增维修记录')
const formRef = ref()
const form = reactive({
  vehicleId: '',
  date: '',
  item: '',
  cost: 0,
  status: 'ongoing',
  desc: ''
})
const rules = {
  vehicleId: [{required: true, message: '请选择车辆', trigger: 'change'}],
  date: [{required: true, message: '请选择维修日期', trigger: 'change'}],
  item: [{required: true, message: '请输入维修项目', trigger: 'blur'}],
  cost: [{required: true, message: '请输入维修费用', trigger: 'blur'}]
}

let currentEditId = null
let currentDeleteId = null

// 辅助函数：状态对应的标签类型和文本
const statusTagType = (status) => {
  const map = {
    ongoing: 'warning',
    completed: 'success',
    pending: 'info'
  }
  return map[status] || 'info'
}
const statusText = (status) => {
  const map = {
    ongoing: '进行中',
    completed: '已完成',
    pending: '待处理'
  }
  return map[status] || status
}

// ==================== API 调用 ====================

// 加载车辆选项
const loadVehicleOptions = async () => {
  try {
    const res = await adminRequest.get('/maintenance/vehicles')
    vehicleOptions.value = res
  } catch (error) {
    ElMessage.error('获取车辆列表失败')
    console.error(error)
  }
}

// 加载维修记录列表
const loadMaintenanceList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      plate: searchForm.plate || undefined,
      status: searchForm.status || undefined,
      dateStart: searchForm.dateStart || undefined,
      dateEnd: searchForm.dateEnd || undefined
    }
    const res = await adminRequest.get('/maintenance/list', {params})
    console.log(res)
    tableData.value = res.records
    console.log(tableData)
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取维修记录失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// ==================== 事件处理 ====================

const handleSearch = () => {
  currentPage.value = 1
  loadMaintenanceList()
}

const resetSearch = () => {
  searchForm.plate = ''
  searchForm.status = ''
  searchForm.dateStart = ''
  searchForm.dateEnd = ''
  handleSearch()
}

const handleAdd = () => {
  dialogTitle.value = '新增维修记录'
  resetForm()
  dialogVisible.value = true
}

const handleView = (row) => {
  // ElMessage.info(`查看维修记录：${row.id}`)
  dialogTitle.value = '查看维修记录'
  resetForm()
  form.id = row.id
  form.vehicleId = row.vehicleId
  form.date = row.maintenanceDate
  form.item = row.maintenanceItem
  form.cost = row.cost
  form.status = row.status
  form.desc = row.remarks || ''
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑维修记录'
  currentEditId = row.id
  // 填充表单
  form.id = row.id
  form.vehicleId = row.vehicleId // 注意：后端 VO 应包含 vehicleId
  form.date = row.maintenanceDate
  form.item = row.maintenanceItem
  form.cost = row.cost
  form.status = row.status
  form.desc = row.remarks || ''
  dialogVisible.value = true
}

const handleDelete = (row) => {
  currentDeleteId = row.id
  deleteDialogVisible.value = true
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.clearValidate()
  }
  form.id = null
  form.vehicleId = ''
  form.date = ''
  form.item = ''
  form.cost = 0
  form.status = 'ongoing'
  form.desc = ''
  currentEditId = null
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        vehicleId: form.vehicleId,
        maintenanceItem: form.item,
        cost: form.cost,
        maintenanceDate: form.date,
        status: form.status,
        remarks: form.desc || ''
      }
      if (dialogTitle.value === '新增维修记录') {
        await adminRequest.post('/maintenance', payload)
        ElMessage.success('维修记录添加成功')
      } else {
        payload.id = currentEditId
        await adminRequest.put(`/maintenance/${currentEditId}`, payload)
        ElMessage.success('维修记录更新成功')
      }
      dialogVisible.value = false
      await loadMaintenanceList()
    } catch (error) {
      ElMessage.error(error || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const confirmDelete = async () => {
  submitting.value = true
  try {
    await adminRequest.delete(`/maintenance/${currentDeleteId}`)
    ElMessage.success('维修记录删除成功')
    deleteDialogVisible.value = false
    await loadMaintenanceList()
  } catch (error) {
    ElMessage.error(error || '删除失败')
  } finally {
    submitting.value = false
    currentDeleteId = null
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  loadMaintenanceList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadMaintenanceList()
}

// 初始化
onMounted(() => {
  loadVehicleOptions()
  loadMaintenanceList()
})
</script>

<style scoped>
.vehicle-maintenance {
  padding: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--el-text-color-primary);
}

/* 表格内样式 */
.vehicle-plate {
  font-weight: 500;
}

.vehicle-model {
  font-size: 12px;
  color: #909399;
}
</style>