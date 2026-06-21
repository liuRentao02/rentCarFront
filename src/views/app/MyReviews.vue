<template>
  <div class="my-reviews">
    <section class="page-header">
      <div class="container">
        <h1 class="page-header__title">我的评论</h1>
      </div>
    </section>

    <main>
      <div class="container">
        <div class="reviews-list" v-loading="loading">
          <el-empty v-if="!loading && reviews.length === 0" description="暂无评论" />
          <div v-else>
            <div v-for="review in reviews" :key="review.id" class="review-card">
              <div class="review-header">
                <img :src="review.carImage" :alt="review.carName" class="car-img" />
                <div class="car-info">
                  <h3>{{ review.carName }}</h3>
                  <el-rate v-model="review.rating" disabled show-score text-color="#ff9900" />
                </div>
                <div class="review-time">{{ formatDate(review.createTime) }}</div>
              </div>
              <div class="review-content">{{ review.content }}</div>
              <div v-if="review.image" class="review-images">
                <el-image
                    v-for="(img, idx) in review.image.split(',')"
                    :key="idx"
                    :src="img"
                    :preview-src-list="review.image.split(',')"
                    style="width: 80px; height: 80px; margin-right: 8px; border-radius: 4px;"
                    fit="cover"
                />
              </div>
              <el-switch
                  v-model="review.status"
                  :active-value="1"
                  :inactive-value="0"
                  active-text="公开"
                  inactive-text="隐藏"
                  @change="updateStatus(review.id, review.status)"
              />
              <div class="review-footer">
                <el-button type="danger" size="small" @click="handleDelete(review.id)">删除</el-button>
              </div>
            </div>

            <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="total"
                :page-sizes="[5, 10, 20]"
                layout="total, sizes, prev, pager, next, jumper"
                background
                @current-change="fetchReviews"
                @size-change="handleSizeChange"
                style="margin-top: 30px; justify-content: center;"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mainRequest } from '@/api'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const reviews = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const formatDate = (datetime) => {
  if (!datetime) return ''
  const date = new Date(datetime)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

const fetchReviews = async () => {
  loading.value = true
  try {
    const res = await mainRequest.get('/reviews/my', {
      params: {
        userId: appStore.userInfo.id,
        page: currentPage.value,
        size: pageSize.value
      }
    })
    reviews.value = res.records
    total.value = res.total
  } catch (error) {
    ElMessage.error(error || '获取评论列表失败')
  } finally {
    loading.value = false
  }
}
const updateStatus = async (id, newStatus) => {
  try {
    await mainRequest.put(`/reviews/${id}/status`, null, {
      params: {
        userId: appStore.userInfo.id,
        status: newStatus
      }
    })
    ElMessage.success(newStatus === 1 ? '已公开' : '已隐藏')
  } catch (error) {
    ElMessage.error(error || '状态更新失败')
    // 回滚状态
    fetchReviews()
  }
}
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await mainRequest.delete(`/reviews/${id}`, {
      params: { userId: appStore.userInfo.id }
    })
    ElMessage.success('删除成功')
    fetchReviews()
  } catch (error) {
    ElMessage.error(error || '删除失败')
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchReviews()
}

onMounted(() => {
  fetchReviews()
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

.reviews-list {
  padding: 40px 0;
}

.review-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 15px;
  margin-top: 15px;
}

.review-card {
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
}

.review-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 15px;
}

.car-img {
  width: 100px;
  height: 70px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.car-info {
  flex: 1;
}

.car-info h3 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
}

.review-time {
  font-size: 0.85rem;
  color: var(--text-light);
}

.review-content {
  color: var(--text-dark);
  line-height: 1.6;
  margin-bottom: 15px;
}

.review-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.review-footer {
  text-align: right;
}
</style>