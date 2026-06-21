<template>
  <div class="system-config">
    <el-card shadow="hover" style="margin-top: 20px;">
      <el-form
          ref="formRef"
          :model="configForm"
          :rules="formRules"
          label-width="120px"
      >
        <!-- 平台信息 -->
        <div class="config-group">
          <div class="config-group-header">
            <div class="config-group-header-left">
              <el-icon><Platform /></el-icon>
              <span>系统配置</span>
            </div>
          </div>
          <!-- 外观设置（仅保留 Logo） -->
          <div class="config-group">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="平台Logo" prop="logo">
                  <el-upload
                      class="logo-uploader"
                      action="http://localhost:8080/api/upload/logo"
                      :show-file-list="false"
                      :before-upload="beforeLogoUpload"
                      :on-success="handleLogoSuccess"
                      :on-error="handleLogoError"
                  >
                    <img v-if="configForm.logo" :src="configForm.logo" class="logo-preview"  alt="系统图片"/>
                    <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
                  </el-upload>
                  <span class="upload-hint">支持 PNG、JPG 格式，建议尺寸 200x60px</span>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="平台名称" prop="platformName" required>
                <el-input v-model="configForm.platformName" placeholder="请输入平台名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="平台宣传语" prop="platformText">
                <el-input v-model="configForm.platformText" placeholder="请输入平台宣传语" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="平台域名" prop="platformUrl" required>
                <el-input v-model="configForm.platformUrl" placeholder="https://example.com" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系邮箱" prop="platformEmail" required>
                <el-input v-model="configForm.platformEmail" placeholder="contact@example.com" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客服电话" prop="platformPhone">
                <el-input v-model="configForm.platformPhone" placeholder="400-XXX-XXXX" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="公司地址" prop="platformAddress">
                <el-input v-model="configForm.platformAddress" placeholder="请输入公司地址" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="工作时间" prop="platformWorkTime">
                <el-input v-model="configForm.platformWorkTime" placeholder="请输入工作时间" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="页脚版权文字" prop="footerText">
                <el-input v-model="configForm.footerText" placeholder="请输入页脚版权文字" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        <div class="form-actions">
          <el-button @click="handleReset">重置配置</el-button>
          <el-button type="primary" @click="handleSave">保存配置</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {Refresh, Check, Platform, Brush, Bell, Plus} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminRequest } from '@/api'
import { useAppStore } from "@/stores/app.js"

const appStore = useAppStore()

// 表单数据
const configForm = reactive({
  logo: '',
  platformName: '',
  platformText: '',
  platformUrl: '',
  platformEmail: '',
  platformPhone: '',
  platformAddress: '',
  platformWorkTime: '',
  footerText: ''
})

const formRules = {
  platformName: [{ required: true, message: '请输入平台名称', trigger: 'blur' }],
  platformUrl: [
    { required: true, message: '请输入平台域名', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL', trigger: 'blur' }
  ],
  platformEmail: [
    { required: true, message: '请输入联系邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  warningStockThreshold: [
    { type: 'number', min: 0, message: '阈值必须大于等于0', trigger: 'blur' }
  ],
  warningOverdueOrderThreshold: [
    { type: 'number', min: 0, message: '阈值必须大于等于0', trigger: 'blur' }
  ]
}

const formRef = ref()

// 获取配置
const fetchConfig = async () => {
  try {
    const res = await adminRequest.get('/system/config')
    Object.assign(configForm,res)
  } catch (error) {
    ElMessage.error('获取配置失败')
  }
}
const handleSave = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid){
      try {
        await adminRequest.post('/system/config', configForm)
        ElMessage.success('保存成功')
        await appStore.init() // 刷新前端全局配置
      } catch (error) {
        ElMessage.error('保存失败')
      }
    }
    else{
      ElMessage.error('请检查表单中的错误信息')
    }
  })
}

const handleReset = () => {
  ElMessageBox.confirm('确定要将所有配置恢复为系统默认值吗？此操作不可撤销。', '重置默认配置', {
    confirmButtonText: '确认重置',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await adminRequest.post('/system/config/reset')
    ElMessage.success('配置已重置为默认值')
    await fetchConfig()
    await appStore.init()
  }).catch(() => {})
}

// Logo 上传相关
const beforeLogoUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) ElMessage.error('只能上传图片文件')
  if (!isLt2M) ElMessage.error('图片大小不能超过 2MB')
  return isImage && isLt2M
}
const handleLogoSuccess = async () => {
  ElMessage.success('Logo上传成功')
  await fetchConfig()
}
const handleLogoError = () => ElMessage.error('Logo上传失败')

onMounted(() => {
  fetchConfig()
})
</script>

<style scoped>
.system-config {
  padding: 0;
}

.config-group {
  margin-bottom: 32px;
}

.config-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--el-color-primary-light-5);
}

.config-group-header .el-icon {
  font-size: 1.2rem;
  color: var(--el-color-primary);
}

.config-group-header span:first-of-type {
  font-weight: 600;
}

.config-group-header-left{
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-uploader:hover {
  border-color: var(--el-color-primary);
}

.logo-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.upload-hint {
  margin-left: 12px;
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color);
}
</style>