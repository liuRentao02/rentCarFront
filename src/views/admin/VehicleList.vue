<template>
  <div class="vehicle-list">
    <PageHeader title="车辆管理" description="管理校园租车平台的所有单车档案信息">
      <el-button type="primary" @click="handleAdd">
        <el-icon>
          <Plus/>
        </el-icon>
        新增车辆
      </el-button>
    </PageHeader>

    <!-- 搜索区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <el-form :inline="true" :model="searchForm" label-width="auto">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="车牌号 / VIN码" clearable @keyup.enter="handleSearch"/>
        </el-form-item>
        <el-form-item label="车辆品牌">
          <el-select v-model="searchForm.brand" placeholder="全部品牌" clearable style="width: 140px;">
            <el-option v-for="brand in brandOptions" :key="brand" :label="brand" :value="brand"/>
          </el-select>
        </el-form-item>
        <el-form-item label="能源类型">
          <el-select v-model="searchForm.energyType" placeholder="全部类型" clearable style="width: 140px;">
            <el-option label="汽油" value="汽油"/>
            <el-option label="纯电动" value="纯电动"/>
            <el-option label="插电混动" value="插电混动"/>
            <el-option label="人力" value="人力"/>
          </el-select>
        </el-form-item>
        <el-form-item label="车辆状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 140px;">
            <el-option label="可租" value="available"/>
            <el-option label="已租" value="rented"/>
            <el-option label="维修中" value="maintenance"/>
            <el-option label="停用" value="offline"/>
          </el-select>
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
          <el-text size="large">
            <el-icon size="1.2em"><Collection /></el-icon>
            <span>单车档案列表</span>
          </el-text>
          <el-tag type="info" size="large">共 {{ total }} 条记录</el-tag>
        </div>
      </template>
      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column label="图片" width="90">
          <template #default="{ row }">
            <el-image style="width: 70px; height: 45px; border-radius: 4px;" :src="row.image.split(',')[0]"
                      :preview-src-list="row.image.split(',')" :preview-teleported="true" fit="cover">
              <template #error>
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                  <el-icon>
                    <Picture/>
                  </el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="plateNumber" label="车牌号" width="120"/>
        <el-table-column prop="brandName" label="品牌" width="100"/>
        <el-table-column prop="modelName" label="车型"/>
        <el-table-column prop="energyType" label="能源" width="90">
          <template #default="{ row }">
            <el-tag :type="row.energyType === '纯电动' ? 'success' : (row.energyType === '汽油' ? 'warning' : 'info')"
                    size="small" effect="light">{{ row.energyType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="vehicleColor" label="颜色" width="80"/>
        <el-table-column prop="currentFuel" label="油量/电量" width="100">
          <template #default="{ row }">
            <span v-if="row.currentFuel !== null">{{ row.currentFuel }}%</span>
            <span v-else style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="日租金" width="100">
          <template #default="{ row }">
            <span style="color: var(--el-color-primary); font-weight: 600;">¥{{ row.dailyRent }}</span>/天
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small" effect="light">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rentalCount" label="累计租赁" width="90"/>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" :icon="View" circle size="small" @click="handleView(row)"/>
            <el-button type="warning" :icon="Edit" circle size="small" @click="handleEdit(row)"/>
            <el-button type="danger" :icon="Delete" circle size="small" @click="handleDelete(row)"/>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; display: flex; justify-content: center;">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]"
                       :total="total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                       @current-change="handleCurrentChange"/>
      </div>
    </el-card>

    <!-- 新增/编辑/查看 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" @close="handleDialogClose">
      <!-- ========== 查看模式：描述列表展示 ========== -->
      <div v-if="dialogMode === 'view'">
        <el-divider content-position="left">单车专属档案</el-divider>
        <el-descriptions :column="3" border size="default">
          <el-descriptions-item label="车牌号">{{ formData.plateNumber }}</el-descriptions-item>
          <el-descriptions-item label="车架号/VIN">{{ formData.vinCode }}</el-descriptions-item>
          <el-descriptions-item label="发动机号">{{ formData.engineNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="车身颜色">{{ formData.vehicleColor }}</el-descriptions-item>
          <el-descriptions-item label="当前里程">{{
              formData.currentMileage ? formData.currentMileage + ' km' : '-'
            }}
          </el-descriptions-item>
          <el-descriptions-item label="油量/电量">{{
              formData.currentFuel !== null ? formData.currentFuel + '%' : '-'
            }}
          </el-descriptions-item>
          <el-descriptions-item label="实际日租金">¥{{ formData.dailyRent }}/天</el-descriptions-item>
          <el-descriptions-item label="实际押金">¥{{ formData.depositAmount }}</el-descriptions-item>
          <el-descriptions-item label="车辆状态">
            <el-tag :type="statusTagType(formData.status)" size="small">{{ statusText(formData.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="上牌日期">{{ formData.licenseDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="保险到期日">{{ formData.insuranceExpiry || '-' }}</el-descriptions-item>
          <el-descriptions-item label="年检到期日">{{ formData.inspectionExpiry || '-' }}</el-descriptions-item>
          <el-descriptions-item label="累计租赁">{{ formData.rentalCount || 0 }} 次</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">关联车型配置</el-divider>
        <el-descriptions :column="3" border size="default">
          <el-descriptions-item label="品牌">{{ formData.brandName }}</el-descriptions-item>
          <el-descriptions-item label="车系">{{ formData.seriesName }}</el-descriptions-item>
          <el-descriptions-item label="具体型号">{{ formData.modelName }}</el-descriptions-item>
          <el-descriptions-item label="类别">{{ formData.category }}</el-descriptions-item>
          <el-descriptions-item label="能源类型">{{ formData.energyType }}</el-descriptions-item>
          <el-descriptions-item label="变速箱">{{ formData.gearboxType }}</el-descriptions-item>
          <el-descriptions-item label="驱动方式">{{ formData.driveMode }}</el-descriptions-item>
          <el-descriptions-item label="排量">{{ formData.displacement }}</el-descriptions-item>
          <el-descriptions-item label="排放标准">{{ formData.emissionStandard }}</el-descriptions-item>
          <el-descriptions-item label="座位数">{{
              formData.seatCount ? formData.seatCount + '座' : '-'
            }}
          </el-descriptions-item>
          <el-descriptions-item label="指导价">{{
              formData.guidePrice ? formData.guidePrice + ' 万元' : '-'
            }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">车辆图片</el-divider>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          <el-image v-for="(url, index) in imageUrlList" :key="index" :src="url"
                    :preview-src-list="imageUrlList" style="width: 120px; height: 90px;" fit="cover"/>
          <span v-if="!imageUrlList.length" style="color:#909399">暂无图片</span>
        </div>
      </div>

      <!-- ========== 新增/编辑模式：条件筛选 + 表单 ========== -->
      <el-form v-else ref="formRef" :model="formData" :rules="formRules" label-width="120px">

        <!-- 步骤 1：通过条件逐步锁定唯一车型 -->
        <el-divider content-position="left">第一步：锁定车型配置</el-divider>
        <el-alert v-if="!formData.modelId" title="请依次选择下方条件，直到筛选出唯一车型，剩余参数将自动填充。" type="info"
                  :closable="false" style="margin-bottom: 15px;"/>
        <el-alert v-else :title="`已锁定车型：${formData.brandName} - ${formData.modelName}。如需更换，请清空下方选项。`"
                  type="success" :closable="false" style="margin-bottom: 15px;"/>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌">
              <el-select
                  v-model="filterForm.brandName"
                  placeholder="选择品牌"
                  clearable
                  @change="onBrandChange"
                  style="width:100%">
                <el-option v-for="b in filterOptions.brands" :key="b" :label="b" :value="b"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车型">
              <el-select v-model="filterForm.category" placeholder="如: 轿车/suv" clearable @change="onOtherChange" style="width:100%" :disabled="!filterForm.brandName">
                <el-option v-for="c in filterOptions.categories" :key="c" :label="c" :value="c"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="变速箱">
              <el-select v-model="filterForm.gearboxType" placeholder="选择变速箱" clearable @change="onOtherChange" style="width:100%" :disabled="!filterForm.brandName">
                <el-option v-for="g in filterOptions.gearboxTypes" :key="g" :label="g" :value="g"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="能源类型">
              <el-select v-model="filterForm.energyType" placeholder="选择能源" clearable @change="onOtherChange" style="width:100%" :disabled="!filterForm.brandName">
                <el-option v-for="e in filterOptions.energyTypes" :key="e" :label="e" :value="e"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="具体型号">
              <el-select v-model="formData.modelId" placeholder="选择型号" clearable @change="handleFinalModelSelect" style="width:100%" :disabled="!filterForm.brandName">
                <el-option v-for="m in filterOptions.matchedModels" :key="m.modelId" :label="m.modelName" :value="m.modelId"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 自动回显区 -->
        <el-row :gutter="20" v-if="formData.modelId">
          <el-col :span="12">
            <el-form-item label="指导价">
              <el-input :value="formData.guidePrice ? formData.guidePrice + ' 万元' : '未设定'" disabled/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="座位数">
              <el-input :value="formData.seatCount + '座'" disabled/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排量/动力">
              <el-input :value="formData.displacement || '-'" disabled/>
            </el-form-item>
          </el-col>
        </el-row>


        <!-- 步骤 2：填写单车专属属性 -->
        <el-divider content-position="left">第二步：填写单车专属属性</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车牌号" prop="plateNumber">
              <el-input v-model="formData.plateNumber" placeholder="如：京A88888"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车架号/VIN" prop="vinCode">
              <el-input v-model="formData.vinCode" placeholder="车辆唯一识别码"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车身颜色" prop="vehicleColor">
              <el-input v-model="formData.vehicleColor" placeholder="如：珍珠白"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发动机号">
              <el-input v-model="formData.engineNo" placeholder="选填"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="当前里程" prop="currentMileage">
              <el-input-number v-model="formData.currentMileage" :min="0" style="width:100%"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="油量/电量(%)">
              <el-input-number v-model="formData.currentFuel" :min="0" :max="100" :precision="1" style="width:100%"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="上牌日期">
              <el-date-picker v-model="formData.licenseDate" type="date" value-format="YYYY-MM-DD" style="width:100%"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="保险到期">
              <el-date-picker v-model="formData.insuranceExpiry" type="date" value-format="YYYY-MM-DD"
                              style="width:100%"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="实际日租金" prop="dailyRent">
              <el-input-number v-model="formData.dailyRent" :precision="2" :min="0" style="width:100%"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实际押金" prop="depositAmount">
              <el-input-number v-model="formData.depositAmount" :precision="2" :min="0" style="width:100%"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年检到期">
              <el-date-picker v-model="formData.inspectionExpiry" type="date" value-format="YYYY-MM-DD"
                              style="width:100%"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车辆状态" prop="status">
              <el-select v-model="formData.status" style="width:100%">
                <el-option label="可租" value="available"/>
                <el-option label="已租" value="rented"/>
                <el-option v-show="dialogMode !== 'edit'" label="维修中" value="maintenance"/>
                <el-option label="停用" value="offline"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="车辆图片">
          <el-upload action="#" list-type="picture-card" :file-list="imageFileList" :auto-upload="false"
                     :on-change="handleImageChange" :on-remove="handleImageRemove" :before-upload="() => false"
                     multiple>
            <el-icon>
              <Plus/>
            </el-icon>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
    <span>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button v-if="dialogMode !== 'view'" type="primary" @click="handleSave" :loading="submitting">保存</el-button>
    </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, reactive, computed, onMounted, nextTick} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {Collection, Delete, Edit, Picture, Plus, View} from '@element-plus/icons-vue'
import {adminRequest, mainRequest} from "@/api/index.js";
import PageHeader from "@/components/admin/PageHeader.vue";

// --- 初始值对象定义 ---
const initialFormData = {
  carId: null,
  modelId: null,
  brandName: '',
  seriesName: '',
  modelName: '',
  category: '',
  energyType: '',
  vehicleLevel: '',
  gearboxType: '',
  driveMode: '',
  displacement: '',
  emissionStandard: '',
  fuelGrade: '',
  seatCount: null,
  sunroofType: '',
  modelInteriorColor: '',
  guidePrice: null,
  plateNumber: '',
  vinCode: '',
  engineNo: '',
  vehicleColor: '',
  currentMileage: 0,
  currentFuel: null,
  licenseDate: '',
  insuranceExpiry: '',
  inspectionExpiry: '',
  dailyRent: null,
  depositAmount: null,
  status: 'available',
  rentalCount: 0,
  imageUrls: ''
}

const initialFilterForm = {
  brandName: '',
  energyType: '',
  category: '',
  gearboxType: '',
  driveMode: ''
}

const initialSearchForm = {
  keyword: '',
  brand: '',
  energyType: '',
  status: ''
}

const initialFilterOptions = {
  brands: [],
  energyTypes: [],
  categories: [],
  gearboxTypes: [],
  driveModes: [],
  matchedModels: []
}

// --- 响应式数据 ---
const formData = reactive({ ...initialFormData })
const filterForm = reactive({ ...initialFilterForm })
const filterOptions = reactive({ ...initialFilterOptions })
const searchForm = reactive({ ...initialSearchForm })

const brandOptions = ref([])
const allModelOptions = ref([])

// 表格与分页
const tableData = ref([])
const loading = ref(false)
const submitting = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 图片上传
const imageFileList = ref([])
const pendingUploadFiles = ref([])

// 弹窗控制
const formRef = ref(null)
const dialogVisible = ref(false)
const dialogMode = ref('view')
const originalCar = ref(null)

const dialogTitle = computed(() => {
  const map = {view: '车辆详情', add: '新增车辆', edit: '编辑车辆'}
  return map[dialogMode.value]
})

// 计算属性：将 imageUrls 拆分为数组
const imageUrlList = computed(() =>
    formData.imageUrls ? formData.imageUrls.split(',') : []
)

// 表单校验规则
const formRules = {
  modelId: [{required: true, message: '请锁定唯一车型', trigger: 'change'}],
  plateNumber: [{required: true, message: '请输入车牌号', trigger: 'blur'}],
  vinCode: [{required: true, message: '请输入车架号/VIN', trigger: 'blur'}],
  vehicleColor: [{required: true, message: '请输入车身颜色', trigger: 'blur'}],
  dailyRent: [{required: true, message: '请输入实际日租金', trigger: 'blur'}],
  status: [{required: true, message: '请选择状态', trigger: 'change'}]
}

// --- 接口请求 ---
const fetchBrands = async () => {
  try {
    brandOptions.value = await adminRequest.get('/vehicle/brands')
  } catch (error) {
    console.error('获取品牌失败', error)
  }
}

const fetchAllModels = async () => {
  try {
    allModelOptions.value = await adminRequest.get('/car-models/all')
    initFilterOptions()
  } catch (error) {
    console.error('获取车型配置失败', error)
  }
}

const fetchVehicles = async () => {
  loading.value = true
  try {
    const res = await adminRequest.post('/vehicle/list', {
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchForm.keyword,
      brand: searchForm.brand,
      energyType: searchForm.energyType,
      status: searchForm.status
    })
    tableData.value = res.records
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

// 获取详情（简化）
const fetchCarDetail = async (id) => {
  try {
    const res = await adminRequest.get(`/vehicle/${id}`)
    Object.assign(formData, res, {
      dailyRent: Number(res.dailyRent),
      depositAmount: Number(res.depositAmount),
      currentMileage: res.currentMileage ?? 0,
      rentalCount: res.rentalCount ?? 0
    })
    return res
  } catch (error) {
    ElMessage.error('获取详情失败')
    throw error
  }
}

// 初始化筛选选项（品牌列表）
const initFilterOptions = () => {
  filterOptions.brands = [...new Set(allModelOptions.value.map(m => m.brandName).filter(Boolean))]
}

// 品牌改变
const onBrandChange = () => {
  formData.modelId = null
  clearAutoFilledData()

  filterForm.energyType = ''
  filterForm.vehicleLevel = ''
  filterForm.category = ''
  filterForm.gearboxType = ''
  filterForm.driveMode = ''

  if (!filterForm.brandName) {
    filterOptions.energyTypes = []
    filterOptions.categories = []
    filterOptions.gearboxTypes = []
    filterOptions.driveModes = []
    filterOptions.matchedModels = []
    return
  }

  const brandCandidates = allModelOptions.value.filter(m => m.brandName === filterForm.brandName)
  filterOptions.energyTypes = [...new Set(brandCandidates.map(m => m.energyType).filter(Boolean))]
  filterOptions.categories = [...new Set(brandCandidates.map(m => m.category).filter(Boolean))]
  filterOptions.gearboxTypes = [...new Set(brandCandidates.map(m => m.gearboxType).filter(Boolean))]
  filterOptions.driveModes = [...new Set(brandCandidates.map(m => m.driveMode).filter(Boolean))]
  filterOptions.matchedModels = brandCandidates

  if (brandCandidates.length === 1) {
    handleFinalModelSelect(brandCandidates[0].modelId)
  }
}

// 其他条件改变
const onOtherChange = () => {
  formData.modelId = null
  clearAutoFilledData()

  const candidates = allModelOptions.value.filter(m => {
    if (m.brandName !== filterForm.brandName) return false
    if (filterForm.energyType && m.energyType !== filterForm.energyType) return false
    if (filterForm.vehicleLevel && m.vehicleLevel !== filterForm.vehicleLevel) return false
    if (filterForm.category && m.category !== filterForm.category) return false
    if (filterForm.gearboxType && m.gearboxType !== filterForm.gearboxType) return false
    if (filterForm.driveMode && m.driveMode !== filterForm.driveMode) return false
    return true
  })

  filterOptions.matchedModels = candidates
  if (candidates.length === 1) {
    handleFinalModelSelect(candidates[0].modelId)
  }
}

// 最终选定车型
const handleFinalModelSelect = (modelId) => {
  const selectedModel = allModelOptions.value.find(m => m.modelId === modelId)
  if (!selectedModel) return

  Object.assign(formData, {
    modelId: selectedModel.modelId,
    brandName: selectedModel.brandName,
    seriesName: selectedModel.seriesName,
    modelName: selectedModel.modelName,
    category: selectedModel.category,
    energyType: selectedModel.energyType,
    gearboxType: selectedModel.gearboxType,
    driveMode: selectedModel.driveMode,
    displacement: selectedModel.displacement,
    emissionStandard: selectedModel.emissionStandard,
    fuelGrade: selectedModel.fuelGrade,
    seatCount: selectedModel.seatCount,
    sunroofType: selectedModel.sunroofType,
    guidePrice: selectedModel.guidePrice
  })

  filterForm.brandName = selectedModel.brandName
  filterForm.energyType = selectedModel.energyType
  filterForm.category = selectedModel.category
  filterForm.gearboxType = selectedModel.gearboxType
  filterForm.driveMode = selectedModel.driveMode
  filterOptions.matchedModels = [selectedModel]
}

// 清空车型相关字段（车辆专属字段保留）
const clearAutoFilledData = () => {
  const modelFields = ['modelId', 'brandName', 'seriesName', 'modelName', 'category', 'energyType',
    'gearboxType', 'driveMode', 'displacement', 'emissionStandard', 'fuelGrade', 'seatCount',
    'sunroofType', 'guidePrice']
  modelFields.forEach(field => { formData[field] = null })
}

// --- UI 交互 ---
const statusTagType = (status) => {
  const map = {available: 'success', rented: 'warning', maintenance: 'info', offline: 'danger'}
  return map[status] || 'info'
}

const statusText = (status) => {
  const map = {available: '可租', rented: '已租', maintenance: '维修中', offline: '停用'}
  return map[status] || '未知'
}

const handleImageChange = (file, fileList) => {
  pendingUploadFiles.value = fileList.map(f => f.raw)
  imageFileList.value = fileList
}

const handleImageRemove = (file, fileList) => {
  pendingUploadFiles.value = fileList.map(f => f.raw)
  imageFileList.value = fileList
}

const resetForm = () => {
  formRef.value?.clearValidate()

  // 重置筛选表单和下拉选项
  Object.assign(filterForm, initialFilterForm)
  Object.assign(filterOptions, initialFilterOptions)

  // 重新加载品牌列表
  initFilterOptions()

  // 重置车辆表单
  Object.assign(formData, initialFormData)

  // 重置图片相关
  imageFileList.value = []
  pendingUploadFiles.value = []
  originalCar.value = null
}

const handleView = async (row) => {
  dialogMode.value = 'view'
  resetForm()
  dialogVisible.value = true
  try {
    await fetchCarDetail(row.carId || row.id)
  } catch (e) {
    dialogVisible.value = false
  }
}

const handleEdit = async (row) => {
  dialogMode.value = 'edit'
  resetForm()
  dialogVisible.value = true
  try {
    const res = await fetchCarDetail(row.carId || row.id)
    if (res.modelId) {
      handleFinalModelSelect(res.modelId)
    }
    originalCar.value = JSON.parse(JSON.stringify({...formData, imageUrls: res.imageUrls || ''}))

    const urls = formData.imageUrls ? formData.imageUrls.split(',') : []
    imageFileList.value = urls.map((url, idx) => ({ name: `图片${idx+1}`, url }))
    pendingUploadFiles.value = []
  } catch (e) {
    dialogVisible.value = false
  }
}

const handleAdd = () => {
  dialogMode.value = 'add'
  resetForm()
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确认删除车牌号为 ${row.plateNumber} 的车辆吗？`, '警告', {type: 'warning'}).then(async () => {
    try {
      await adminRequest.delete(`/vehicle/${row.carId || row.id}`)
      ElMessage.success('删除成功')
      await fetchVehicles()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleSave = async () => {
  await nextTick()
  await formRef.value?.validate()
  submitting.value = true
  try {
    const oldImages = imageFileList.value
        .filter(item => item.url && !item.raw)
        .map(item => item.url)
    const newFiles = imageFileList.value
        .filter(item => item.raw)
        .map(item => item.raw)

    const newImageUrls = []
    for (const file of newFiles) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const url = await mainRequest.post('/upload/avatar', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        newImageUrls.push(url)
      } catch (error) {
        ElMessage.error(error || `图片 ${file.name} 上传失败`)
      }
    }

    const finalImageUrls = [...oldImages, ...newImageUrls].join(',')

    let payload = {
      modelId: formData.modelId,
      plateNumber: formData.plateNumber,
      vinCode: formData.vinCode,
      engineNo: formData.engineNo,
      vehicleColor: formData.vehicleColor,
      currentMileage: formData.currentMileage,
      currentFuel: formData.currentFuel,
      licenseDate: formData.licenseDate,
      insuranceExpiry: formData.insuranceExpiry,
      inspectionExpiry: formData.inspectionExpiry,
      dailyRent: formData.dailyRent,
      depositAmount: formData.depositAmount,
      status: formData.status,
      imageUrls: finalImageUrls
    }

    if (dialogMode.value === 'edit') {
      payload.carId = formData.carId
      await adminRequest.put(`/vehicle`, payload)
      ElMessage.success('更新成功')
    } else {
      await adminRequest.post('/vehicle', payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await fetchVehicles()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

const handleDialogClose = () => {
  resetForm()
}

const handleSearch = () => {
  currentPage.value = 1
  fetchVehicles()
}

const resetSearch = () => {
  Object.assign(searchForm, initialSearchForm)
  handleSearch()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchVehicles()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchVehicles()
}

onMounted(() => {
  fetchBrands()
  fetchAllModels()
  fetchVehicles()
})
</script>

<style scoped>
.vehicle-list {
  padding: 0;
}

:deep(.el-divider) {
  margin: 10px 0 15px 0;
}
</style>