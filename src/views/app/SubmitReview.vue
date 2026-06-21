<template>
  <section class="page-header">
    <div class="container">
      <h1 class="page-header__title">发表评论</h1>
      <nav class="page-header__breadcrumb">
        <router-link to="/">首页</router-link> /
        <router-link :to="`/order/${orderId}`">订单详情</router-link> /
        <span>发表评论</span>
      </nav>
    </div>
  </section>

  <main>
    <div class="container">
      <el-card v-loading="loading">
        <div v-if="order">
          <div class="review-order-info">
            <img :src="order.carImage" :alt="order.carName" class="car-image" />
            <div class="car-info">
              <h3>{{ order.carName }}</h3>
              <p>租期：{{ formatDate(order.rentStartTime) }} ~ {{ formatDate(order.rentEndTime) }}</p>
            </div>
          </div>

          <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
            <el-form-item label="评分" prop="rating">
              <el-rate v-model="form.rating" :colors="['#F7BA2A', '#F7BA2A', '#F7BA2A']" />
            </el-form-item>
            <el-form-item label="评论内容" prop="content">
              <el-input
                  v-model="form.content"
                  type="textarea"
                  :rows="5"
                  placeholder="请分享您的用车体验（选填）"
                  maxlength="500"
                  show-word-limit
              />
            </el-form-item>
            <el-form-item label="上传图片">
              <el-upload
                  action="#"
                  list-type="picture-card"
                  :auto-upload="false"
                  :on-change="handleImageChange"
                  :before-upload="() => false"
                  multiple
                  :file-list="imageFileList"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">支持jpg/png，最多上传3张，每张不超过2MB</div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submit" :loading="submitting">提交评论</el-button>
              <el-button @click="router.back()">返回</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { mainRequest } from '@/api'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const orderId = route.params.id
const order = ref(null)
const loading = ref(false)
const submitting = ref(false)

const form = ref({
  rating: 5,
  content: '',
  images: ''
})
const imageFileList = ref([])
const formRef = ref(null)

const rules = {
  rating: [{ required: true, message: '请选择评分', trigger: 'change' }]
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

const fetchOrder = async () => {
  loading.value = true
  try {
    order.value = await mainRequest.get(`/orders/${orderId}`, {
      params: { userId: appStore.userInfo.id }
    })
    // 检查是否已评论
    const reviewed = await mainRequest.get(`/reviews/check/${orderId}`, {
      params: { userId: appStore.userInfo.id }
    })
    if (reviewed) {
      ElMessage.warning('您已评论过该订单')
      router.push(`/order/${orderId}`)
    }
  } catch (error) {
    ElMessage.error(error||'获取订单信息失败')
    router.push('/profile/orders')
  } finally {
    loading.value = false
  }
}

const handleImageChange = async (file, fileList) => {
  imageFileList.value = fileList
  // 逐个上传图片
  const uploadedUrls = []
  for (const f of fileList) {
    // if (f.url) continue // 已上传的跳过///
    const formData = new FormData()
    formData.append('file', f.raw)
    try {
      const url = await mainRequest.post('/upload/RImg', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log(url)
      uploadedUrls.push(url)
    } catch (error) {
      ElMessage.error(`图片 ${f.name} 上传失败`)
    }
  }
  form.value.images = uploadedUrls.join(',')
}

const submit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    await mainRequest.post('/reviews', {
      orderId: Number(orderId),
      carId: order.value.carId,
      rating: form.value.rating,
      content: form.value.content,
      images: form.value.images
    }, {
      params: { userId: appStore.userInfo.id }
    })
    ElMessage.success('评论成功')
    await router.push(`/order/${orderId}`)
  } catch (error) {
    ElMessage.error(error || '评论失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchOrder()
})
</script>

<style scoped>
.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.page-header {
  margin-top: 70px;
  padding: 40px 0;
  background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
  color: var(--white);
}

.page-header__title {
  font-size: 2rem;
  margin-bottom: 5px;
}

.page-header__breadcrumb {
  font-size: 0.9rem;
  opacity: 0.8;
}

.review-order-info {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: var(--bg-light);
  border-radius: var(--radius);
  margin-bottom: 30px;
}

.car-image {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.car-info h3 {
  margin: 0 0 8px 0;
}

.upload-tip {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 5px;
}
</style>