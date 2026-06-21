<template>
  <div class="profile-center">
    <!-- 用户信息卡片 -->
    <el-card shadow="hover" class="profile-header" :body-style="{ padding: 0 }">
      <div class="profile-header__banner"></div>
      <div class="profile-header__content">
        <el-avatar :size="100" class="profile-header__avatar" :src="appStore.userInfo.avatar">管</el-avatar>
        <div class="profile-header__info">
          <h1 class="profile-header__name">{{ appStore.userInfo.realName }}</h1>
          <el-tag type="primary" effect="light" class="profile-header__role">
            <span>🛡️</span> {{ appStore.userInfo.role }}
          </el-tag>
        </div>
        <div class="profile-header__actions">
          <el-button size="small" @click="handleEditProfile">✏️ 编辑资料</el-button>
          <el-button type="primary" size="small" @click="handleChangeAvatar">📷 更换头像</el-button>
        </div>
      </div>
      <div class="profile-header__meta">
        <div class="profile-meta__item">
          <span class="profile-meta__label">账号ID</span>
          <span class="profile-meta__value">{{ appStore.userInfo.id }}</span>
        </div>
        <div class="profile-meta__item">
          <span class="profile-meta__label">注册时间</span>
          <span class="profile-meta__value">{{ appStore.userInfo.createTime }}</span>
        </div>
        <div class="profile-meta__item">
          <span class="profile-meta__label">邮箱</span>
          <span class="profile-meta__value">{{ appStore.userInfo.email }}</span>
        </div>
        <div class="profile-meta__item">
          <span class="profile-meta__label">电话</span>
          <span class="profile-meta__value">{{ appStore.userInfo.iphone }}</span>
        </div>
      </div>
    </el-card>

    <!-- 两栏布局 -->
    <el-row :gutter="24" style="margin-top: 24px;">
      <!-- 左侧内容 -->
      <el-col :span="16">
        <!-- 账户设置 -->
        <el-card shadow="hover" class="settings-card">
          <template #header>
            <span><el-icon><Setting /></el-icon> 账户设置</span>
          </template>
          <div class="settings-list">
            <div v-for="item in accountSettings" :key="item.key" class="settings-item" @click="handleSettingClick(item.common)">
              <div class="settings-item__icon" :class="`settings-item__icon--${item.iconType}`">
                {{ item.icon }}
              </div>
              <div class="settings-item__content">
                <div class="settings-item__label">{{ item.label }}</div>
                <div class="settings-item__desc">{{ item.desc }}</div>
              </div>
              <span class="settings-item__value">{{ item.value }}</span>
              <span class="settings-item__arrow">›</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <!-- 右侧边栏 -->
      <el-col :span="8">
        <!-- 账户状态 -->
        <el-card shadow="hover">
          <template #header>
            <span><el-icon><SuccessFilled /></el-icon> 账户状态</span>
          </template>
          <div class="account-status">
            <div class="status-item">
              <span>账户状态</span>
              <el-tag size="small" v-if="appStore.userInfo?.state === 1" type="success">正常</el-tag>
              <el-tag size="small" v-else type="danger">封禁</el-tag>
            </div>
            <div class="status-item">
              <span>实名认证</span>
              <el-tag size="small" v-if="appStore.userInfo?.idCard !== null" type="success">已认证</el-tag>
              <el-tag size="small" v-else type="danger">未认证</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 编辑资料对话框（原有，增强提交逻辑） -->
    <el-dialog v-model="profileDialogVisible" title="编辑个人资料" width="600px" @close="resetProfileForm">
      <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="profileForm.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phone">
              <el-input v-model="profileForm.phone" placeholder="请输入手机号码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电子邮箱" prop="email">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份id" prop="idCard">
              <el-input v-model="profileForm.idCard" placeholder="请输入身份id" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="个人简介" prop="bio">
          <el-input v-model="profileForm.bio" type="textarea" :rows="3" placeholder="介绍一下自己..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="profileDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProfile">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增：头像设置弹窗 -->
    <el-dialog v-model="avatarDialogVisible" title="更换头像" width="500px">
      <div class="avatar-upload-container" style="text-align: center;">
        <div class="avatar-preview" style="margin-bottom: 20px;">
          <el-avatar :size="120" :src="avatarPreviewUrl || appStore.userInfo.avatar">
            {{ !avatarPreviewUrl && !appStore.userInfo.avatar ? '管' : '' }}
          </el-avatar>
        </div>
        <el-upload
            ref="uploadRef"
            class="avatar-uploader"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :http-request="uploadAvatar"
            accept="image/jpeg,image/png,image/jpg"
        >
          <el-button type="primary">选择图片</el-button>
          <template #tip>
            <div class="el-upload__tip">支持 jpg/png 格式，大小不超过 2MB</div>
          </template>
        </el-upload>
      </div>
      <template #footer>
        <el-button @click="avatarDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUpload">确认上传</el-button>
      </template>
    </el-dialog>

    <!-- 新增：修改密码弹窗 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="500px">
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input type="password" v-model="passwordForm.oldPassword" placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input type="password" v-model="passwordForm.newPassword" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input type="password" v-model="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {onMounted, reactive, ref} from 'vue'
import {Document, Setting, SuccessFilled} from '@element-plus/icons-vue'
import {ElMessage} from 'element-plus'
import {useAppStore} from "@/stores/app.js"
import {adminRequest} from "@/api/index.js"

const appStore = useAppStore()

// 账户设置列表
const accountSettings = ref([
  { key: 'profile', icon: '👤', iconType: 'primary', label: '个人资料', desc: '修改姓名、联系方式等基本信息', value: '已完善', common: '1' },
  { key: 'avatar', icon: '🖼️', iconType: 'info', label: '头像设置', desc: '上传或更换个人头像图片', value: '已设置', common: '2' },
  { key: 'password', icon: '🔑', iconType: 'danger', label: '修改密码', desc: '定期更换密码保障账户安全', value: '30天前修改', common: '3' },
])


// 编辑资料对话框
const profileDialogVisible = ref(false)
const profileFormRef = ref()
const profileForm = reactive({
  name: appStore.userInfo.realName || '',
  phone: appStore.userInfo.iphone || '',
  email: appStore.userInfo.email || '',
  idCard: appStore.userInfo.idCard || '',
  bio: ''
})
const profileRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }]
}

// 头像设置相关
const avatarDialogVisible = ref(false)
const avatarPreviewUrl = ref('')
const selectedFile = ref(null)

// 修改密码相关
const passwordDialogVisible = ref(false)
const passwordFormRef = ref()
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const validateConfirm = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

// 方法：处理账户设置点击（根据 common 值打开不同弹窗）
const handleSettingClick = (type) => {
  switch (type) {
    case '1': // 个人资料
      profileDialogVisible.value = true
      break
    case '2': // 头像设置
      avatarDialogVisible.value = true
      break
    case '3': // 修改密码
      passwordDialogVisible.value = true
      break
    default:
      ElMessage.info('该功能即将上线')
  }
}

// 编辑资料相关方法
const handleEditProfile = () => {
  profileDialogVisible.value = true
}

const resetProfileForm = () => {
  profileFormRef.value?.clearValidate()
}

const submitProfile = async () => {
  if (!profileFormRef.value) return
  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 调用后端更新用户信息接口（请根据实际后端地址调整）
        await adminRequest.put('/profile', {
          id: appStore.userInfo.id,
          realName: profileForm.name,
          phone: profileForm.phone,
          email: profileForm.email,
          idCard: profileForm.idCard
        })
        // 更新本地 store 数据
        appStore.userInfo.realName = profileForm.name
        appStore.userInfo.iphone = profileForm.phone
        appStore.userInfo.email = profileForm.email
        appStore.userInfo.idCard = profileForm.idCard
        ElMessage.success('个人资料已更新')
        profileDialogVisible.value = false
      } catch (error) {
        ElMessage.error('更新失败：' + (error || error.message))
      }
    }
  })
}

// 头像上传相关方法
const handleChangeAvatar = () => {
  avatarDialogVisible.value = true
}

const beforeAvatarUpload = (file) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isJpgOrPng) {
    ElMessage.error('头像只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  selectedFile.value = file
  avatarPreviewUrl.value = URL.createObjectURL(file)
  return false // 阻止自动上传，由 confirmUpload 处理
}

const uploadAvatar = () => {
  // 实际上传由 confirmUpload 处理，此处留空
}

const confirmUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择图片')
    return
  }
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  const userId = appStore.userInfo.id;
  try {
    const newAvatarUrl = await adminRequest.post(`/avatar/${userId}`, formData, {
      headers: {'Content-Type': 'multipart/form-data'}
    })
    if (newAvatarUrl) {
      appStore.userInfo.avatar = newAvatarUrl
      ElMessage.success('头像更新成功')
    } else {
      ElMessage.success('头像上传成功')
    }
    avatarDialogVisible.value = false
    selectedFile.value = null
    avatarPreviewUrl.value = ''
  } catch (error) {
    ElMessage.error('上传失败：' + (error || error.message))
  }
}

// 修改密码相关方法
const submitPassword = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await adminRequest.post('/change-password', {
          id: appStore.userInfo.id,
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
        ElMessage.success('密码修改成功，请重新登录')
        passwordDialogVisible.value = false
        // 清空表单
        passwordForm.oldPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
        // 可选：跳转到登录页
        // router.push('/login')
      } catch (error) {
        ElMessage.error('修改失败：' + (error || error.message))
      }
    }
  })
}
</script>

<style scoped>
/* 原有样式保持不变 */
.profile-center {
  padding: 0;
}

.profile-header {
  overflow: hidden;
}
.profile-header__banner {
  height: 140px;
  background: var(--bg-user-color);
  position: relative;
}
.profile-header__banner::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
.profile-header__content {
  padding: 0 32px 24px;
  display: flex;
  align-items: flex-end;
  gap: 24px;
  margin-top: -50px;
  position: relative;
}
.profile-header__avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  border: 4px solid white;
  box-shadow: var(--el-box-shadow-light);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-header__info {
  flex: 1;
  padding-bottom: 8px;
}
.profile-header__name {
  font-size: 1.6rem;
  color: var(--el-text-color-primary);
  margin: 0 0 4px 0;
}
.profile-header__role {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}
.profile-header__actions {
  display: flex;
  gap: 10px;
  padding-bottom: 8px;
}
.profile-header__meta {
  display: flex;
  gap: 32px;
  padding: 16px 32px;
  border-top: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
}
.profile-meta__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.profile-meta__label {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}
.profile-meta__value {
  font-size: 0.95rem;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.settings-card {
  margin-bottom: 20px;
}
.settings-list {
  display: flex;
  flex-direction: column;
}
.settings-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color);
  transition: all 0.2s;
  cursor: pointer;
}
.settings-item:last-child {
  border-bottom: none;
}
.settings-item:hover {
  background-color: var(--el-color-primary-light-9);
}
.settings-item__icon {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.settings-item__icon--primary {
  background: linear-gradient(135deg, var(--el-color-primary-light-9), #d0e3f7);
  color: var(--el-color-primary);
}
.settings-item__icon--success {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  color: var(--el-color-success);
}
.settings-item__icon--warning {
  background: linear-gradient(135deg, #fff3cd, #ffeeba);
  color: #d39e00;
}
.settings-item__icon--danger {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  color: var(--el-color-danger);
}
.settings-item__icon--info {
  background: linear-gradient(135deg, #d1ecf1, #bee5eb);
  color: var(--el-color-info);
}
.settings-item__content {
  flex: 1;
}
.settings-item__label {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
}
.settings-item__desc {
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
}
.settings-item__value {
  font-size: 0.85rem;
  color: var(--el-text-color-regular);
}
.settings-item__arrow {
  color: var(--el-text-color-secondary);
  font-size: 1rem;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color);
  transition: all 0.2s;
}
.history-item:last-child {
  border-bottom: none;
}
.history-item:hover {
  background: var(--el-fill-color-light);
}
.history-item__icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}
.history-item__icon--success {
  background: #d4edda;
  color: var(--el-color-success);
}
.history-item__icon--warning {
  background: #fff3cd;
  color: #856404;
}
.history-item__icon--danger {
  background: #f8d7da;
  color: var(--el-color-danger);
}
.history-item__icon--info {
  background: #cce5ff;
  color: #004085;
}
.history-item__content {
  flex: 1;
}
.history-item__title {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}
.history-item__desc {
  font-size: 0.85rem;
  color: var(--el-text-color-secondary);
}
.history-item__time {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  margin-bottom: 12px;
}
.stat-item__value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}
.stat-item__label {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.quick-action-btn:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.quick-action-btn__icon {
  font-size: 1.2rem;
}
.quick-action-btn__text {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.account-status {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.status-item span:first-child {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
}
</style>