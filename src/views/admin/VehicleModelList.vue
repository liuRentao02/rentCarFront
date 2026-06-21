<template>
  <div class="car-model-list">
    <PageHeader title="车型管理" description="管理车辆品牌、车系及详细规格参数">
      <el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>新增车型</el-button>
    </PageHeader>

    <!-- 搜索区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="品牌">
          <el-input v-model="searchForm.brandName" placeholder="品牌名称" clearable />
        </el-form-item>
        <el-form-item label="车系">
          <el-input v-model="searchForm.seriesName" placeholder="车系名称" clearable />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="searchForm.modelName" placeholder="型号全称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <template #header>
        <div style="display: flex; justify-content: space-between;">
          <span><el-icon><Collection /></el-icon> 车型列表</span>
          <el-tag type="info">共 {{ total }} 条</el-tag>
        </div>
     </template>
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="brandName" label="品牌" min-width="100" />
        <el-table-column prop="seriesName" label="车系" min-width="120" />
        <el-table-column prop="modelName" label="型号" min-width="180" />
        <el-table-column prop="category" label="类别" width="100" />
        <el-table-column prop="energyType" label="能源类型" width="100" />
        <el-table-column prop="gearboxType" label="变速箱" width="100" />
        <el-table-column prop="driveMode" label="驱动方式" width="100" />
        <el-table-column prop="seatCount" label="座位数" width="80" />
        <el-table-column prop="vehicleLevel" label="车型大小" width="100"/>
        <el-table-column prop="sunroofType" label="天窗" width="100"/>
        <el-table-column prop="interiorColor" label="内饰颜色" width="100"/>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" :icon="View" circle size="small" @click="handleView(row)" />
            <el-button type="warning" :icon="Edit" circle size="small" @click="handleEdit(row)" />
            <el-button type="danger" :icon="Delete" circle size="small" @click="handleDelete(row)" />
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 20px; text-align: center;display: flex;justify-content: center">
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5,10,20,50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchList"
            @current-change="fetchList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑/查看对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" destroy-on-close @close="resetForm">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="110px" :disabled="dialogMode === 'view'">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌" prop="brandName">
              <el-input v-model="formData.brandName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车系" prop="seriesName">
              <el-input v-model="formData.seriesName" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="型号全称" prop="modelName">
              <el-input v-model="formData.modelName" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车型大小">
              <el-input v-model="formData.vehicleLevel" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="能源类型" prop="energyType">
              <el-select v-model="formData.energyType" style="width:100%">
                <el-option label="人力" value="人力"/>
                <el-option label="汽油" value="汽油"/>
                <el-option label="纯电动" value="纯电动"/>
                <el-option label="插电混动" value="插电混动"/>
                <el-option label="油电混动" value="油电混动"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排放标准">
              <el-input v-model="formData.emissionStandard" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="变速箱" prop="gearboxType">
              <el-select v-model="formData.gearboxType" style="width:100%">
                <el-option label="自动挡" value="自动挡"/>
                <el-option label="手动挡" value="手动挡"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="驱动方式" prop="driveMode">
              <el-select v-model="formData.driveMode" style="width:100%">
                <el-option label="前驱" value="前驱"/>
                <el-option label="后驱" value="后驱"/>
                <el-option label="四驱" value="四驱"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="燃油标号">
              <el-input v-model="formData.fuelGrade" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排量L/续航KM">
              <el-input v-model="formData.displacement" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="座位数" prop="seatCount">
              <el-input-number v-model="formData.seatCount" :min="1" :max="9" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="天窗类型">
              <el-input v-model="formData.sunroofType" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内饰颜色">
              <el-input v-model="formData.interiorColor" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="指导价(万元)">
              <el-input-number v-model="formData.guidePrice" :precision="2" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status">
                <el-option label="正常" :value="1"/>
                <el-option label="停用" :value="0"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="dialogMode !== 'view'" type="primary" @click="submitForm" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Collection, View, Edit, Delete } from '@element-plus/icons-vue'
import { adminRequest } from '@/api'
import PageHeader from "@/components/admin/PageHeader.vue"

const loading = ref(false)
const submitting = ref(false)
const searchForm = reactive({ brandName: '', seriesName: '', modelName: '' })
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const dialogMode = ref('add')
const dialogTitle = ref('新增车型')
const formRef = ref(null)
const formData = reactive({
  modelId: null, brandName: '', seriesName: '', modelName: '', vehicleLevel: '', category: '',
  energyType: '汽油', emissionStandard: '', gearboxType: '自动挡', driveMode: '前驱',
  fuelGrade: '', displacement: '', seatCount: 5, sunroofType: '', interiorColor: '',
  guidePrice: null, status: 1
})

const rules = {
  brandName: [{ required: true, message: '请输入品牌', trigger: 'blur' }],
  seriesName: [{ required: true, message: '请输入车系', trigger: 'blur' }],
  modelName: [{ required: true, message: '请输入型号全称', trigger: 'blur' }],
  seatCount: [{ required: true, message: '请输入座位数', trigger: 'blur' }],
  energyType: [{ required: true, message: '请选择能源类型', trigger: 'change' }],
  gearboxType: [{ required: true, message: '请选择变速箱', trigger: 'change' }]
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      ...searchForm
    }
    const res = await adminRequest.get('/car-models', { params })
    tableData.value = res.records
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取车型列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { currentPage.value = 1; fetchList() }
const resetSearch = () => { Object.assign(searchForm, { brandName: '', seriesName: '', modelName: '' }); handleSearch() }

const resetForm = () => {
  formRef.value?.clearValidate()
  Object.assign(formData, { modelId: null, brandName: '', seriesName: '', modelName: '', vehicleLevel: '', category: '', energyType: '汽油', emissionStandard: '', gearboxType: '自动挡', driveMode: '前驱', fuelGrade: '', displacement: '', seatCount: 5, sunroofType: '', interiorColor: '', guidePrice: null, status: 1 })
}

const handleAdd = () => { dialogMode.value = 'add'; dialogTitle.value = '新增车型'; resetForm(); dialogVisible.value = true }
const handleView = (row) => { dialogMode.value = 'view'; dialogTitle.value = '查看车型'; Object.assign(formData, row); dialogVisible.value = true }
const handleEdit = (row) => { dialogMode.value = 'edit'; dialogTitle.value = '编辑车型'; Object.assign(formData, row); dialogVisible.value = true }

const submitForm = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    const payload = { ...formData }

    if (dialogMode.value === 'add') {
      await adminRequest.post('/car-models', payload)
      ElMessage.success('新增成功')
    } else {
      await adminRequest.put(`/car-models`, payload)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    await fetchList()
  } catch (error) {
    ElMessage.error(error || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除车型“${row.brandName} ${row.modelName}”吗？`, '删除确认', { type: 'warning' })
      .then(async () => {
        await adminRequest.delete(`/car-models/${row.modelId}`)
        ElMessage.success('删除成功')
        await fetchList()
      }).catch(() => {})
}

onMounted(() => { fetchList(); })
</script>
<style scoped>
.car-model-list {
  padding: 0;
}
</style>