<template>
  <div>
    <!--    <h2>认证审核</h2>-->
    <page-header title="认证审核" description="用户提交的学生认证申请列表">
      <template #default>
        <el-button type="primary" @click="handleAdd">新增学生</el-button>
      </template>
    </page-header>
    <!-- 搜索栏 -->
    <el-card shadow="hover" style="margin-bottom: 20px;">
      <el-form :inline="true" :model="searchForm" label-width="auto">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 140px;">
            <el-option label="待审核" :value="0" />
            <el-option label="通过" :value="1" />
            <el-option label="拒绝" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="姓名/学号/学校" clearable style="width: 220px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-table :data="list" v-loading="loading" stripe border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="realName" label="姓名" />
      <el-table-column prop="studentId" label="学号" />
      <el-table-column prop="school" label="学校" />
      <el-table-column label="证明材料">
        <template #default="{ row }">
          <div style="display: flex; flex-wrap: wrap; gap: 5px;">
            <el-image
                :src="row.imageUrls"
                :preview-src-list="row.imageUrls.split(',')"
                show-progress
                :preview-teleported="true"
                :teleported="false"
                style="width: 50px; height: 50px; margin-right: 5px; border-radius: 4px;"
                fit="cover"
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'warning' : row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 0 ? '待审核' : row.status === 1 ? '通过' : '拒绝' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="applyTime" label="申请时间" width="160" />
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button
              v-if="row.status === 0"
              type="primary"
              size="small"
              @click="audit(row.id, 1)"
          >
            通过
          </el-button>
          <el-button
              v-if="row.status === 0"
              type="danger"
              size="small"
              @click="audit(row.id, 2)"
          >
            拒绝
          </el-button>
          <el-button
              type="danger"
              size="small"
              @click="handleDelete(row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
        size="large"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[5, 10, 20, 50]"
        layout="prev, pager, next, sizes"
        background
        @current-change="fetchList"
        @size-change="fetchList"
        style="margin-top: 20px;display: flex;justify-content: center;"
    />

    <!-- 新增学生认证弹窗 -->
    <el-dialog
        v-model="showAdd"
        title="新增学生认证"
        width="600px"
        :close-on-click-modal="false"
        @close="handleDialogClose"
    >
      <el-form
          ref="addFormRef"
          :model="addForm"
          :rules="addRules"
          label-width="100px"
          style="padding-right: 20px;"
      >
        <el-form-item label="选择用户" prop="userId">
          <el-select
              v-model="addForm.userId"
              filterable
              remote
              reserve-keyword
              :remote-method="searchUserList"
              :loading="userLoading"
              placeholder="请输入姓名/手机号搜索用户"
              clearable
              @change="handleUserChange"
          >
            <el-option
                v-for="user in userOptions"
                :key="user.id"
                :label="`${user.realName || user.nickname || user.username} (${user.phone || '无手机号'})`"
                :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用户姓名" prop="realName">
          <el-input v-model="addForm.realName" placeholder="用户姓名自动填充" disabled />
        </el-form-item>
        <el-form-item label="学校" prop="school">
          <el-input v-model="addForm.school" placeholder="请输入学校名称" />
        </el-form-item>
        <el-form-item label="学号" prop="studentId">
          <el-input v-model="addForm.studentId" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item label="证明材料" prop="imageUrls">
          <el-upload
              ref="uploadRef"
              :file-list="uploadFileList"
              :http-request="customUpload"
              :on-remove="handleRemove"
              :before-upload="beforeUpload"
              list-type="picture-card"
              multiple
              :limit="9"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div style="font-size: 12px; color: #999; margin-top: 8px;">
                支持 jpg/png 格式，单张不超过 5MB，最多上传 9 张
              </div>
            </template>
          </el-upload>
          <!-- 预览用，实际已在上方展示 -->
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAdd = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitAdd">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {Plus} from '@element-plus/icons-vue'
import {adminRequest, mainRequest} from '@/api'
import { useAppStore } from '@/stores/app'
import PageHeader from "@/components/admin/PageHeader.vue"


const appStore = useAppStore()
const list = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(5)
const loading = ref(false)
const showAdd = ref(false)
const addFormRef = ref(null)
const submitLoading = ref(false)

// 用户远程搜索相关
const userOptions = ref([])
const userLoading = ref(false)

// 上传相关
const uploadFileList = ref([]) // 存储已上传的文件对象，用于展示
const uploadRef = ref(null)

// 新增表单数据
const addForm = reactive({
  userId: null,
  realName: '',
  school: '',
  studentId: '',
  imageUrls: '' // 逗号分隔的图片URL字符串
})

// 表单校验规则
const addRules = {
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
  school: [{ required: true, message: '请输入学校', trigger: 'blur' }],
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }]
}

// 搜索表单
const searchForm = reactive({
  status: null,
  keyword: ''
})
// 删除认证记录
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该条认证记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await adminRequest.delete(`/certification/${id}`, {
      params: { adminUserId: appStore.userInfo.id }
    })
    ElMessage.success('删除成功')
    await fetchList() // 刷新列表
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error || '删除失败')
    }
  }
}
// 获取认证列表
const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    if (searchForm.status !== null && searchForm.status !== undefined) {
      params.status = searchForm.status
    }
    if (searchForm.keyword) {
      params.keyword = searchForm.keyword.trim()
    }
    const data = await adminRequest.get('/certification/list', { params })
    list.value = data.records
    total.value = data.total
  } catch (error) {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchList()
}

const resetSearch = () => {
  searchForm.status = null
  searchForm.keyword = ''
  handleSearch()
}

// 审核
const audit = async (id, status) => {
  const action = status === 1 ? '通过' : '拒绝'
  try {
    const { value } = await ElMessageBox.prompt(`请输入审核备注（${action}）`, '审核', {
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
    await adminRequest.put('/certification/audit', {
      id,
      status,
      remark: value
    }, {
      params: { adminUserId: appStore.userInfo.id }
    })
    ElMessage.success(`已${action}`)
    await fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error || '操作失败')
    }
  }
}

// ================= 新增学生认证相关 =================
const handleAdd = () => {
  showAdd.value = true
  // 打开弹窗时重置表单和上传列表
  resetAddForm()
  // 加载初始用户列表（默认关键词为空）
  searchUserList('')
}

// 重置新增表单数据
const resetAddForm = () => {
  addForm.userId = null
  addForm.realName = ''
  addForm.school = ''
  addForm.studentId = ''
  addForm.imageUrls = ''
  uploadFileList.value = []
  if (addFormRef.value) {
    addFormRef.value.clearValidate()
  }
}

// 关闭弹窗时的额外清理
const handleDialogClose = () => {
  resetAddForm()
}

// 远程搜索用户
const searchUserList = async (query) => {
  if (userLoading.value) return
  userLoading.value = true
  try {
    const res = await adminRequest.get('/users', {
      params: {
        keyword: query || '',
        page: 1,
        size: 20
      }
    })
    // 根据实际返回结构调整，假设返回数据在 records 或 data 中
    userOptions.value = res.records || res.data || []
  } catch (error) {
    ElMessage.error('获取用户列表失败')
    userOptions.value = []
  } finally {
    userLoading.value = false
  }
}

// 选择用户后，回填真实姓名（展示用）
const handleUserChange = (userId) => {
  const selectedUser = userOptions.value.find(u => u.id === userId)
  if (selectedUser) {
    addForm.realName = selectedUser.realName || selectedUser.nickname || selectedUser.username || ''
  } else {
    addForm.realName = ''
  }
}

// 自定义上传图片，使用 adminRequest 上传
const customUpload = async (options) => {
  const { file, onSuccess, onError } = options
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await mainRequest.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    // 假设后端返回 { url: 'xxx' } 或直接返回图片url字符串
    console.log(res)
    const imageUrl = res.url || res.data || res
    if (imageUrl) {
      // 上传成功，将返回的url添加到addForm.imageUrls中，并维护文件列表
      const currentUrls = addForm.imageUrls ? addForm.imageUrls.split(',') : []
      currentUrls.push(imageUrl)
      addForm.imageUrls = currentUrls.join(',')
      // 同时更新uploadFileList用于展示
      uploadFileList.value.push({
        name: file.name,
        url: imageUrl,
        uid: file.uid
      })
      onSuccess(imageUrl)
    }
  } catch (error) {
    ElMessage.error(error||'图片上传失败')
    onError(error)
  }
}

// 删除图片时，同步更新 imageUrls
const handleRemove = (file, fileList) => {
  for (const obj in fileList.value) {
    mainRequest.delete("/upload/delete", {
      params: {
        url: obj.url
      }
    })
  }
  // fileList 是删除后的最新列表
  const urls = fileList.map(item => item.url).filter(url => url)
  addForm.imageUrls = urls.join(',')
  // 同步更新 uploadFileList 的引用（fileList 已经是新的，但 uploadFileList 需要同步）
  uploadFileList.value = fileList
}

// 上传前校验文件大小和类型
const beforeUpload = (file) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传 JPG/PNG 格式的图片!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

// 提交新增认证
const submitAdd = async () => {
  if (!addFormRef.value) return
  try {
    await addFormRef.value.validate()
  } catch (error) {
    ElMessage.warning('请完整填写表单')
    return
  }

  submitLoading.value = true
  try {
    // 构建提交参数，状态默认为 1（通过），因为管理员直接新增默认认证通过
    const params = {
      userId: addForm.userId,
      realName: addForm.realName,      // 冗余传递，后端可用可不用
      school: addForm.school,
      studentId: addForm.studentId,
      imageUrls: addForm.imageUrls,
      status: 1,                         // 通过
      auditUserId: appStore.userInfo.id
    }
    await adminRequest.post('/certification/add', params, {
      params: { adminUserId: appStore.userInfo.id }
    })
    ElMessage.success('新增学生认证成功')
    showAdd.value = false
    await fetchList() // 刷新列表
  } catch (error) {
    ElMessage.error(error || '新增失败，请稍后重试')
  } finally {
    submitLoading.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
:deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
}
:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 80px;
  height: 80px;
}
</style>