<template>
  <!-- ========== 主内容：两列布局 ========== -->
  <main role="main">
    <div class="container">
      <div class="profile-main">
        <!-- 左侧边栏：用户卡片 + 导航菜单 -->
        <aside class="sidebar" aria-label="用户菜单">
          <div class="user-card">
            <img
                :src="userData.avatar"
                alt="用户头像"
                class="user-card__avatar"
                loading="lazy"
            />
            <h2 class="user-card__name">{{ userData.username }}</h2>
            <span class="user-card__level">{{ userData.level }}</span>
          </div>
          <div style="display: flex;justify-content: center"  v-if="userData.role !== 'student'" @click="router.push('/profile/certification/student')">
            <el-button type="primary" >
              学生认证
            </el-button>
          </div>
        </aside>

        <!-- 右侧内容区 -->
        <div class="profile-content">
          <!-- 欢迎卡片 + 快捷操作 -->
          <div class="welcome-card">
            <div>
              <h3 class="welcome-card__title">你好，{{ userData.username }} 👋</h3>
              <p class="welcome-card__text">欢迎来到个人空间</p>
            </div>
          </div>

          <!-- 统计卡片 -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-card__value">{{ userData.totalRentals }}</div>
              <div class="stat-card__label">总租车次数</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">{{ userData.points }}</div>
              <div class="stat-card__label">可用积分</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">{{ userData.balance }}</div>
              <div class="stat-card__label">账户余额</div>
            </div>
          </div>

          <!-- 个人资料卡片 -->
          <div class="info-card">
            <div class="info-card__header">
              <h3 class="info-card__title">基本信息</h3>
              <button class="btn-edit" @click="openEditDialog">编辑资料</button>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-item__label">真实姓名</span>
                <span class="info-item__value">{{ userData.realName }}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">手机号码</span>
                <span class="info-item__value">
                  {{ userData.iphone }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-item__label">电子邮箱</span>
                <span class="info-item__value">{{ userData.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">学生认证</span>
                <span class="info-item__value">
                  <template v-if="userData.role === 'student'">✅ 已认证</template>
                  <template v-else>未认证</template>
                </span>
              </div>
              <div class="info-item">
                <span class="info-item__label">驾驶证</span>
                <span class="info-item__value">{{ userData.drivingLicense }}</span>
              </div>
              <div class="info-item">
                <span class="info-item__label">等级</span>
                <span class="info-item__value">{{ userData.membership }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- 编辑资料模态框 -->
  <el-dialog v-model="editDialogVisible" title="编辑资料" width="600px" destroy-on-close>
    <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="120">
      <!-- 头像改为 base64 上传 -->
      <el-form-item label="头像" prop="avatar">
        <el-upload
            :show-file-list="false"
            :auto-upload="false"
            :before-upload="beforeAvatarUpload"
            :on-change="handleAvatarChange"
        >
          <img v-if="editForm.avatar" :src="editForm.avatar" class="avatar" alt="头像" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>
      <el-form-item label="用户名" prop="username" label-width="120">
        <el-input v-model="editForm.username" placeholder="请输入用户名"/>
      </el-form-item>
      <el-form-item label="真实姓名" prop="realName" label-width="120">
        <el-input v-model="editForm.realName" placeholder="请输入真实姓名"/>
      </el-form-item>
      <el-form-item label="手机号码" prop="iphone" label-width="120">
        <el-input v-model="editForm.iphone" placeholder="请输入手机号"/>
      </el-form-item>
      <el-form-item label="电子邮箱" prop="email" label-width="120">
        <el-input v-model="editForm.email" placeholder="请输入邮箱"/>
      </el-form-item>
      <el-form-item label="驾驶证信息" prop="drivingLicense" label-width="120">
        <el-input v-model="editForm.drivingLicense" placeholder="例如：绑定 · 2027-08到期"/>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="editLoading">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {ElMessage} from 'element-plus';
import {mainRequest} from '@/api';
import {useAppStore} from "@/stores/app.js";
import {Plus} from "@element-plus/icons-vue";
import {useRouter} from "vue-router";

const router = useRouter();
const appStore = useAppStore();
const userData = ref({})

// ========== 获取个人中心数据 ==========
const fetchProfile = async () => {
  try {
    const data = await mainRequest.get('/user/profile', { params: { id: appStore.userInfo.id } });
    userData.value = data
    if (data) {
      appStore.userInfo.avatar = data.avatar;
    }
  } catch (error) {
    ElMessage.error(error||'获取个人中心数据失败');
  }
};

// ========== 编辑资料 ==========
const editDialogVisible = ref(false);
const editLoading = ref(false);
const editFormRef = ref(null);
const editForm = ref({});

const editRules = {
  username: [
    { required: false, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2到20个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '只能包含字母、数字、下划线、中文', trigger: 'blur' }
  ],
  realName: [
    { required: false, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  iphone: [
    { required: false, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  email: [
    { required: false, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  drivingLicense: [{ required: false, message: '请输入驾驶证信息', trigger: 'blur' }]
};

const openEditDialog = () => {
  editForm.value = { ...userData.value }; // 使用浅拷贝避免直接修改原数据
  editDialogVisible.value = true;
};

// 头像上传前校验
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isImage) {
    ElMessage.error('只能上传图片文件！');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB！');
    return false;
  }
  return true;
};

// 头像选择后转为 base64 存储到 editForm
const handleAvatarChange = async (file) => {
  if (!beforeAvatarUpload(file.raw)) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    editForm.value.avatar = e.target.result;  // data:image/...;base64,...
  };
  reader.readAsDataURL(file.raw);
};

// 提交编辑
const submitEdit = async () => {
  if (!editFormRef.value) return;
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return;
    editLoading.value = true;
    try {
      editForm.value.id = appStore.userInfo.id;
      // 将整个 editForm（含 base64 头像）一起提交
      await mainRequest.put('/user/profile', editForm.value);
      ElMessage.success('修改成功');
      editDialogVisible.value = false;
      if (editForm.value.username === appStore.userInfo.username){
        await fetchProfile();   // 刷新页面数据
      }else {
        appStore.clearUserData()
        router.push("/")
      }
    } catch (error) {
      ElMessage.error(error || '修改失败');
    } finally {
      editLoading.value = false;
    }
  });
};

// ========== 初始化 ==========
onMounted(() => {
  fetchProfile();
});
</script>

<style scoped>
.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

/* 个人中心主布局 */
.profile-main {
  margin-top: 70px;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 30px;
  padding: 40px 0;
}

/* 侧边栏 */
.sidebar {
  background: var(--white);
  border-radius: var(--radius);
  padding: 30px 20px;
  box-shadow: var(--shadow-sm);
  height: fit-content;
  position: sticky;
  top: 100px;
}

.user-card {
  text-align: center;
  padding-bottom: 25px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;
}

.user-card__avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--primary-light);
  margin-bottom: 15px;
  transition: var(--transition);
}

.user-card__avatar:hover {
  border-color: var(--primary-color);
}

.user-card__name {
  font-size: 1.3rem;
  color: var(--text-dark);
  margin-bottom: 5px;
}

.user-card__level {
  display: inline-block;
  padding: 4px 16px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  color: var(--text-dark);
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 20px;
}

/* 右侧内容区 */
.profile-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* 欢迎卡片 */
.welcome-card {
  background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
  color: var(--white);
  border-radius: var(--radius);
  padding: 30px;
  box-shadow: var(--shadow-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.welcome-card__title {
  font-size: 1.6rem;
  margin-bottom: 8px;
}

.welcome-card__text {
  opacity: 0.9;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 25px 20px;
  box-shadow: var(--shadow-sm);
  text-align: center;
  transition: var(--transition);
  border: 1px solid var(--border-color);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
}

.stat-card__value {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1.2;
}

.stat-card__label {
  font-size: 0.9rem;
  color: var(--text-light);
  margin-top: 5px;
}

/* 信息卡片 */
.info-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 30px;
  box-shadow: var(--shadow-sm);
}

.info-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.info-card__title {
  font-size: 1.3rem;
  color: var(--primary-dark);
  position: relative;
  padding-bottom: 8px;
}

.info-card__title::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background: var(--primary-color);
  border-radius: 2px;
}

.btn-edit {
  background: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 8px 18px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.btn-edit:hover {
  background: var(--primary-color);
  color: white;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 25px 35px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item__label {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 5px;
}

.info-item__value {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-dark);
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-success {
  background-color: #e3f7e7;
  color: #0b6e2e;
  font-size: 0.75rem;
  padding: 2px 12px;
  border-radius: 20px;
  font-weight: 600;
}

.avatar {
  width: 200px;
}

.avatar-uploader-icon {
  width: 120px;
  height: 120px;
  border-radius: 5px;
  border: #a6a5a5 solid 1px;
  font-size: 50px;
}

/* 响应式适配 */
@media (max-width: 1024px) {
  .profile-main {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .info-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}
</style>