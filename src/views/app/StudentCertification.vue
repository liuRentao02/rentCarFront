<template>
  <div class="certification-container">
    <el-card>
      <template #header>
        <h2>学生认证</h2>
        <p class="desc">完成学生认证可享受专属优惠</p>
      </template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" v-loading="submitting">
      <el-form-item label="真实姓名" prop="realName">
        <el-input v-model="form.realName" placeholder="请输入真实姓名" />
      </el-form-item>
      <el-form-item label="学号" prop="studentId">
        <el-input v-model="form.studentId" placeholder="请输入学号" />
      </el-form-item>
      <el-form-item label="学校" prop="school">
        <el-input v-model="form.school" placeholder="请输入学校名称" />
      </el-form-item>
      <el-form-item label="身份证号" prop="idCard">
        <el-input v-model="form.idCard" placeholder="选填，用于验证" />
      </el-form-item>
      <el-form-item label="证明材料" prop="imageUrls">
        <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :on-change="handleFileChange"
            :before-upload="beforeUpload"
            :file-list="fileList"
            multiple
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
        <div class="upload-tip">支持jpg/png，最多上传3张，需包含学生证照片</div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit" :loading="submitting">提交申请</el-button>
        <el-button @click="router.back()">返回</el-button>
      </el-form-item>
    </el-form>
    </el-card>
  </div>

</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { mainRequest } from '@/api'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()
const formRef = ref(null)
const submitting = ref(false)
const fileList = ref([])

const form = reactive({
  userId: appStore.userInfo?.id,
  realName: '',
  studentId: '',
  school: '',
  idCard: '',
  imageUrls: ''
})

const rules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  school: [{ required: true, message: '请输入学校', trigger: 'blur' }]
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB')
    return false
  }
  return true
}

const handleFileChange = async (uploadFile) => {
  if (!beforeUpload(uploadFile.raw)) {
    return
  }
  // 实际应逐个上传，获取URL后拼接
  const formData = new FormData()
  formData.append('file', uploadFile.raw)
  try {
    const url = await mainRequest.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    // 拼接 imageUrls
    if (form.imageUrls) {
      form.imageUrls += ',' + url
    } else {
      form.imageUrls = url
    }
    fileList.value.push({ name: uploadFile.name, url })
  } catch (error) {
    ElMessage.error(error||'图片上传失败')
  }
}

const submit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    await mainRequest.post('/certification/student/apply', form)
    ElMessage.success('申请提交成功，请等待审核')
    router.push('/profile')
  } catch (error) {
    ElMessage.error(error || '提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.certification-container {
  max-width: 600px;
  margin: 50px auto 20px;
  padding: 30px;
}

.desc {
  color: var(--text-light);
}

.upload-tip {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 8px;
}
</style>