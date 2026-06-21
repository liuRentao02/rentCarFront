<template>
  <div class="user-list">
    <page-header title="用户管理" description="管理校园租车平台的所有用户账户和权限">
      <el-button type="primary" @click="handleAdd" :loading="loading">
        <el-icon>
          <Plus/>
        </el-icon>
        新增用户
      </el-button>
    </page-header>

    <!-- 统计概览卡片 -->
    <el-row :gutter="16" style="margin-top: 20px; display: flex; flex-wrap: nowrap;">
      <el-col v-for="stat in statistics" :key="stat.status" style="flex: 1; min-width: 0;">
        <el-card
            :class="['stat-card', { 'stat-card--active': activeStat === stat.status }]"
            shadow="hover"
            @click="handleStatClick(stat)"
        >
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="stat-icon" :class="`stat-icon--${stat.status}`">
              {{ stat.icon }}
            </div>
            <div>
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索筛选区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <el-form :inline="true" :model="searchForm" label-width="auto">
        <el-form-item label="关键词搜索">
          <el-input v-model="searchForm.keyword" placeholder="用户名 / 邮箱 / 手机号" clearable/>
        </el-form-item>
        <el-form-item label="用户角色">
          <el-select v-model="searchForm.role" placeholder="全部角色" clearable style="width: 140px;">
            <el-option label="管理员" value="admin"/>
            <el-option label="学生" value="student"/>
            <el-option label="普通用户" value="user"/>
          </el-select>
        </el-form-item>
        <el-form-item label="用户状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 140px;">
            <el-option label="正常" value="active"/>
            <el-option label="已禁用" value="inactive"/>
            <el-option label="待验证" value="pending"/>
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
              v-model="searchForm.registerDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span><el-icon><User/></el-icon> 用户列表</span>
          <el-tag type="info" size="small">共 {{ total }} 条记录</el-tag>
        </div>
      </template>

      <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
        <el-table-column label="用户信息" width="100">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 12px;">
              <el-avatar :size="40" :style="{ background: row.avatarColor }">
                {{ row.realName?.charAt(0) || row.username?.charAt(0) || "？" }}
              </el-avatar>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="realName" label="真实姓名"/>
        <el-table-column prop="gender" label="性别" width="80"/>
        <el-table-column prop="username" label="登录账号"/>
        <el-table-column prop="nickname" label="昵称"/>
        <el-table-column prop="phone" label="手机号" width="120"/>
        <el-table-column prop="email" label="邮箱"/>
        <el-table-column label="用户角色" width="120">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.role)" size="small" effect="light">
              {{ roleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rentalCount" label="租车次数" width="100"/>
        <el-table-column prop="points" label="积分" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small" effect="light">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="registerTime" label="注册时间" width="160"/>

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

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
        v-model="userDialogVisible"
        :title="userDialogTitle"
        width="600px"
        destroy-on-close
        @close="resetUserForm"
    >
      <el-form
          ref="userFormRef"
          :model="userForm"
          label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="登录账号" prop="username">
              <el-input v-model="userForm.username" placeholder="请输入登录账号"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="userForm.realName" placeholder="请输入真实姓名"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="userForm.nickname" placeholder="请输入昵称"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phone">
              <el-input v-model="userForm.phone" placeholder="请输入11位手机号"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电子邮箱" prop="email">
              <el-input v-model="userForm.email" placeholder="请输入邮箱地址"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户角色" prop="role">
              <el-select v-model="userForm.role" placeholder="请选择角色" style="width: 100%;">
                <el-option label="管理员" value="admin"/>
                <el-option label="学生" value="student"/>
                <el-option label="普通用户" value="user"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="身份证号" prop="idCard">
              <el-input v-model="userForm.idCard" placeholder="请输入身份证号"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="驾驶证号" prop="licenseNo">
              <el-input v-model="userForm.licenseNo" placeholder="请输入驾驶证号"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账户状态" prop="status">
              <el-select v-model="userForm.status" placeholder="请选择状态" style="width: 100%;">
                <el-option label="正常" value="active"/>
                <el-option label="禁用" value="inactive"/>
                <el-option label="待验证" value="pending"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="userForm.gender" placeholder="请选择" style="width: 100%;">
                <el-option label="男" value="male"/>
                <el-option label="女" value="female"/>
                <el-option label="未知" value=""/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="积分" prop="points">
          <el-input v-model="userForm.points" placeholder="请输入积分"/>
        </el-form-item>
        <el-form-item label="联系地址" prop="address">
          <el-input v-model="userForm.address" placeholder="请输入联系地址"/>
        </el-form-item>
        <el-form-item label="备注信息" prop="remark">
          <el-input v-model="userForm.remark" type="textarea" rows="3" placeholder="请输入备注信息"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUserForm" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 用户详情对话框 -->
    <el-dialog
        v-model="detailDialogVisible"
        title="用户详情"
        width="700px"
        destroy-on-close
    >
      <div class="user-detail" v-if="currentUser" v-loading="detailLoading">
        <!-- 头部信息 -->
        <div class="detail-header">
          <el-avatar :size="80" :style="{ background: currentUser.avatarColor }">
            {{ currentUser.realName?.charAt(0) || '?' }}
          </el-avatar>
          <div class="detail-header-info">
            <h2>{{ currentUser.realName || currentUser.username }}</h2>
            <div>{{ currentUser.email }}</div>
            <div style="margin-top: 8px;">
              <el-tag :type="roleTagType(currentUser.role)" size="small" effect="light">
                {{ roleText(currentUser.role) }}
              </el-tag>
              <el-tag :type="statusTagType(currentUser.status)" size="small" effect="light" style="margin-left: 8px;">
                {{ statusText(currentUser.status) }}
              </el-tag>
            </div>
          </div>
        </div>

        <el-descriptions :column="2" border style="margin-top: 20px;">
          <el-descriptions-item label="用户ID">{{ currentUser.id }}</el-descriptions-item>
          <el-descriptions-item label="真实姓名">{{ currentUser.realName || '未实名' }}</el-descriptions-item>
          <el-descriptions-item label="登录账号">{{ currentUser.username }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ currentUser.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号码">{{ currentUser.phone }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ currentUser.idCard || '未提供' }}</el-descriptions-item>
          <el-descriptions-item label="驾驶证号">{{ currentUser.licenseNo || '未提供' }}</el-descriptions-item>
          <el-descriptions-item label="性别">
            {{ currentUser.gender === 'male' ? '男' : currentUser.gender === 'female' ? '女' : '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="联系地址">{{ currentUser.address || '未提供' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ currentUser.registerTime }}</el-descriptions-item>
          <el-descriptions-item label="最后登录">{{ currentUser.lastLogin || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="租车次数">{{ currentUser.rentalCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="累计消费">¥{{ (currentUser.totalSpent || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="账户余额">¥{{ (currentUser.balance || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="积分">{{ currentUser.points || 0 }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromDetail">编辑用户</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted} from 'vue'
import {
  Plus, View, Edit, Delete, User
} from '@element-plus/icons-vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {adminRequest} from '@/api'
import PageHeader from "@/components/admin/PageHeader.vue"; // 假设管理端请求实例
const originalUser = ref(null); // 用于编辑时保存原始数据
// 加载状态
const loading = ref(false)
const submitting = ref(false)
const detailLoading = ref(false)

// 统计卡片数据
const statistics = ref([
  {status: 'all', label: '全部用户', value: 0, icon: '👥'},
  {status: 'active', label: '正常用户', value: 0, icon: '✅'},
  {status: 'inactive', label: '已禁用', value: 0, icon: '🚫'},
  {status: 'admin', label: '管理员', value: 0, icon: '🛡️'}
])

const activeStat = ref('all')

// 搜索表单
const searchForm = reactive({
  keyword: '',
  role: '',
  status: '',
  registerDate: ''
})

// 表格数据
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(5)

// 用户对话框
const userDialogVisible = ref(false)
const userDialogTitle = ref('新增用户')
const userFormRef = ref()
const userForm = reactive({
  id: '',
  username: '',
  realName: '',
  nickname: '',
  phone: '',
  email: '',
  role: '',
  idCard: '',
  licenseNo: '',
  status: 'active',
  gender: '',
  address: '',
  remark: ''
})

// 详情对话框
const detailDialogVisible = ref(false)
const currentUser = ref(null)

// 辅助函数（不变）
const roleTagType = (role) => {
  const map = {admin: 'danger', operator: 'success', user: 'info'}
  return map[role] || 'info'
}
const roleText = (role) => {
  const map = {admin: '管理员', operator: '运营人员',  user: '普通用户'}
  return map[role] || role
}
const statusTagType = (status) => {
  const map = {active: 'success', inactive: 'danger', pending: 'warning'}
  return map[status] || 'info'
}
const statusText = (status) => {
  const map = {active: '正常', inactive: '已禁用', pending: '待验证'}
  return map[status] || status
}

// ==================== API 调用 ====================

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const res = await adminRequest.get('/users/statistics')
    statistics.value = statistics.value.map(stat => ({
      ...stat,
      value: res[stat.status] || 0
    }))
  } catch (error) {
    console.error(error)
  }
}

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    // 状态转换：active -> 1, inactive -> 0, pending -> 2
    let stateParam = undefined
    if (searchForm.status === 'active') stateParam = 1
    else if (searchForm.status === 'inactive') stateParam = 0
    else if (searchForm.status === 'pending') stateParam = 2

    const params = {
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchForm.keyword || undefined,
      role: searchForm.role || undefined,
      state: stateParam,                 // 传递给后端的 state 字段（数字）
      registerDate: searchForm.registerDate || undefined
    }
    const res = await adminRequest.get('/users', {params})

    tableData.value = res.records.map(user => ({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      realName: user.realName,
      email: user.email,
      phone: user.phone || user.iphone, // 适配字段
      avatarColor: generateAvatarColor(user.id),
      role: user.role,
      rentalCount: user.rentalCount || 0,
      status: mapBackendStatus(user.status), // state: 0-正常, 1-禁用
      registerTime: user.registerTime,
      lastLogin: user.lastLoginTime || null,
      idCard: user.idCard || '',
      licenseNo: user.licenseNo || '',
      gender: genderOption(user.gender) || '',
      address: user.address,
      totalSpent: user.totalSpent,
      balance: user.balance,
      points: user.points || 0,
    }))
    total.value = res.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const genderOption = (sex) => {
  const genderOptions = [
    {value: 'male', label: '男'},
    {value: 'female', label: '女'},
    {value: 'other', label: '其他'}
  ]
  return genderOptions.find(option => option.value === sex)?.label || '未知'
}

// 生成头像颜色（根据ID）
const generateAvatarColor = (id) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9b59b6', '#3498db', '#e67e22']
  return colors[(id % colors.length)]
}

// 将后端state转换为前端status
const mapBackendStatus = (state) => {
  if (state === 1) return 'active'
  if (state === 0) return 'inactive'
  return 'pending'
}

// 获取用户详情
const fetchUserDetail = async (id) => {
  detailLoading.value = true
  try {
    const user = await adminRequest.get(`/users/${id}`)
    currentUser.value = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      realName: user.realName,
      email: user.email,
      phone: user.phone || user.iphone,
      avatarColor: generateAvatarColor(user.id),
      role: user.role,
      status: mapBackendStatus(user.status),
      registerTime: user.registerTime,
      lastLogin: user.lastLogin,
      rentalCount: user.rentalCount || 0,
      idCard: user.idCard,
      licenseNo: user.licenseNo,
      gender: user.gender,
      address: user.address,
      totalSpent: user.totalSpent || 0,
      balance: user.balance || 0,
      points: user.points || 0
    }
  } catch (error) {
    ElMessage.error('获取用户详情失败')
    console.error(error)
  } finally {
    detailLoading.value = false
  }
}

// ==================== 事件处理 ====================

const handleStatClick = (stat) => {
  activeStat.value = stat.status
  if (stat.status === 'all') {
    searchForm.role = ''
    searchForm.status = ''
  } else if (stat.status === 'admin') {
    searchForm.role = stat.status    // 角色筛选
    searchForm.status = ''
  } else {
    searchForm.status = stat.status  // 状态筛选（active/inactive）
    searchForm.role = ''
  }
  handleSearch()
}

const handleSearch = () => {
  currentPage.value = 1
  fetchUsers()
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.role = ''
  searchForm.status = ''
  searchForm.registerDate = ''
  activeStat.value = 'all'
  handleSearch()
}

const handleAdd = () => {
  userDialogTitle.value = '新增用户'
  resetUserForm()
  userDialogVisible.value = true
}

const handleView = async (row) => {
  await fetchUserDetail(row.id)
  detailDialogVisible.value = true
}

// 修改 handleEdit，保存原始数据（这里使用 row 数据，但可能需要深拷贝）
const handleEdit = (row) => {
  userDialogTitle.value = '编辑用户';
  // 填充表单
  userForm.id = row.id;
  userForm.username = row.username;
  userForm.realName = row.realName;
  userForm.nickname = row.nickname;
  userForm.phone = row.phone;
  userForm.email = row.email;
  userForm.role = row.role;
  userForm.idCard = row.idCard || '';
  userForm.licenseNo = row.licenseNo || '';
  userForm.status = row.status;
  userForm.gender = row.gender || '';
  userForm.address = row.address || '';
  userForm.points = row.points || 0;
  userForm.remark = ''; // row.remark 可能不存在，默认为空
  // 保存原始数据副本（深拷贝，但 row 中可能没有 remark，可以手动补充）
  originalUser.value = JSON.parse(JSON.stringify({
    id: row.id,
    username: row.username,
    realName: row.realName,
    nickname: row.nickname,
    phone: row.phone,
    email: row.email,
    role: row.role,
    idCard: row.idCard,
    licenseNo: row.licenseNo || '',
    status: row.status,
    gender: row.gender,
    address: row.address,
    points: row.points || 0,
    remark: '' // 默认空
  }));
  userDialogVisible.value = true;
};

const handleDelete = (row) => {
  ElMessageBox.confirm(
      '您确定要删除该用户吗？此操作将清除用户的所有数据，且无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
  ).then(async () => {
    try {
      console.log( row)
      await adminRequest.delete(`/users/${row.id}`)
      ElMessage.success(`用户 ${row.realName} 已删除`)
      await fetchUsers()
      await fetchStatistics()
    } catch (error) {
      ElMessage.error(error || '删除失败')
    }
  }).catch(() => {
  })
}
const handleEditFromDetail = () => {
  detailDialogVisible.value = false
  handleEdit(currentUser.value)
}

const resetUserForm = () => {
  userForm.id = undefined
  userForm.username = ''
  userForm.nickname = ''
  userForm.realName = ''
  userForm.phone = ''
  userForm.email = ''
  userForm.role = ''
  userForm.idCard = ''
  userForm.licenseNo = ''
  userForm.status = 'active'
  userForm.gender = ''
  userForm.address = ''
  userForm.remark = ''
  userForm.points = 0
  userFormRef.value?.clearValidate()
}
const mapFrontendStatus = (status) => {
  if (status === 'active') return 1
  if (status === 'inactive') return 0
  return -1
}
const submitUserForm = async () => {
  if (!userFormRef.value) return;
  await userFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      let payload = {};

      if (userDialogTitle.value === '新增用户') {
        // 新增：发送全量数据
        payload = {
          username: userForm.username,
          nickname: userForm.nickname,
          realName: userForm.realName,
          phone: userForm.phone,
          email: userForm.email,
          role: userForm.role,
          idCard: userForm.idCard,
          drivingLicense: userForm.licenseNo,
          state: mapFrontendStatus(userForm.status),
          gender: userForm.gender || null,
          address: userForm.address,
          points: userForm.points || 0,
          remark: userForm.remark
        };
        await adminRequest.post('/users', payload);
        ElMessage.success('用户添加成功');
      } else {
        // 编辑：只发送变化字段
        if (!originalUser.value) {
          // 如果没有原始数据，则发送全量（保底）
          payload = {
            id: userForm.id,
            username: userForm.username,
            nickname: userForm.nickname,
            realName: userForm.realName,
            phone: userForm.phone,
            email: userForm.email,
            role: userForm.role,
            idCard: userForm.idCard,
            drivingLicense: userForm.licenseNo,
            state: mapFrontendStatus(userForm.status),
            gender: userForm.gender || null,
            address: userForm.address,
            points: userForm.points || 0,
            remark: userForm.remark
          };
        } else {
          // 比较每个字段，构建变化对象
          const changes = {};
          const fields = [
            'username', 'nickname', 'realName', 'phone', 'email', 'role',
            'idCard', 'licenseNo', 'status', 'gender', 'address', 'remark',
              'points'
          ];
          fields.forEach(field => {
            // 处理状态字段特殊转换：status -> state
            if (field === 'status') {
              const originalState = mapFrontendStatus(originalUser.value.status);
              const newState = mapFrontendStatus(userForm.status);
              if (originalState !== newState) {
                changes.state = newState;
              }
            } else {
              const originalVal = originalUser.value[field];
              const newVal = userForm[field];
              if (originalVal !== newVal) {
                // 对于 licenseNo 字段，后端需要 drivingLicense
                if (field === 'licenseNo') {
                  changes.drivingLicense = newVal;
                } else {
                  changes[field] = newVal;
                }
              }
            }
          });
          // 必须包含 id
          if (Object.keys(changes).length > 0) {
            payload = {id: userForm.id, ...changes};
          } else {
            // 没有变化，直接提示成功并关闭
            ElMessage.info('未做任何修改');
            userDialogVisible.value = false;
            submitting.value = false;
            return;
          }
        }
        await adminRequest.put(`/users/${userForm.id}`, payload);
        ElMessage.success('用户信息更新成功');
      }
      userDialogVisible.value = false;
      await fetchUsers();
      await fetchStatistics();
    } catch (error) {
      ElMessage.error(error || '操作失败');
    } finally {
      submitting.value = false;
    }
  });
};

// 分页事件
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchUsers()
}
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchUsers()
}

// 初始化
onMounted(() => {
  fetchStatistics()
  fetchUsers()
})
</script>

<style scoped>
.user-list {
  padding: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--el-text-color-primary);
}

/* 统计卡片 */
.stat-card {
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}

.stat-card--active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.stat-icon--all {
  background-color: #f5f7fa;
}

.stat-icon--active {
  background-color: #d4edda;
}

.stat-icon--inactive {
  background-color: #f8d7da;
}

.stat-icon--admin {
  background-color: #cce5ff;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
}

/* 详情对话框头部 */
.detail-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9), #f5f7fa);
  border-radius: 8px;
}

.detail-header-info h2 {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
}

/* 权限组 */
.permission-group {
  margin-bottom: 24px;
}

.permission-group h4 {
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.perm-desc {
  font-size: 12px;
  color: #909399;
  margin-left: 24px;
}
</style>