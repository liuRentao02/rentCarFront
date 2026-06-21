<template>
  <div class="change-password">
    <el-card shadow="hover">
      <template #header>
        <h2 style="margin:0; font-size: 20px;">🔒 修改密码</h2>
      </template>

      <el-form
          ref="formRef"
          :model="passwordForm"
          :rules="rules"
          label-width="120px"
          size="large"
          @submit.prevent="handleSubmit"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
              v-model="passwordForm.oldPassword"
              type="password"
              show-password
              placeholder="请输入原密码"
              autocomplete="current-password"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
              v-model="passwordForm.newPassword"
              type="password"
              show-password
              placeholder="请输入新密码（至少6位）"
              autocomplete="new-password"
          />
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              show-password
              placeholder="请再次输入新密码"
              autocomplete="new-password"
          />
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"
              :loading="loading"
              @click="handleSubmit"
          >
            确认修改
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { mainRequest } from '@/api'
import { useRouter } from 'vue-router'
import {useAppStore} from "@/stores/app.js";
const appStore = useAppStore()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

// 表单数据
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 自定义验证：确认密码必须与新密码一致
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' },
    { max: 30, message: '密码长度不能超过30位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await mainRequest.put('/user/password', {
        userId: appStore.userInfo.id,
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      })
      ElMessage.success('密码修改成功，请重新登录')
      appStore.clearUserData()
      router.push("/")
    } catch (error) {
      ElMessage.error(error || '修改失败，请检查原密码是否正确')
    } finally {
      loading.value = false
    }
  })
}

// 重置表单
const handleReset = () => {
  formRef.value?.resetFields()
}
</script>

<style scoped>
.change-password {
  max-width: 600px;
  margin: 70px auto;
  padding: 50px 15px;
}

:deep(.el-card__header) {
  background-color: var(--el-color-primary-light-9);
  border-bottom: 1px solid var(--el-border-color-light);
}
</style>