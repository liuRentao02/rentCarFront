<template>
  <main role="main">
    <!-- 统计概览区 -->
    <section class="stats-section" aria-label="评论统计">
      <div class="container">
        <div class="stats-grid">
          <div class="stats-item">
            <div class="stats-item__value">{{ stats.avgRating }}</div>
            <div class="stats-item__label">综合评分</div>
            <div class="stats-item__stars" :aria-label="stats.avgRating + '星'">★★★★★</div>
          </div>
          <div class="stats-item">
            <div class="stats-item__value">{{ stats.totalReviews }}</div>
            <div class="stats-item__label">用户评论</div>
          </div>
          <div class="stats-item">
            <div class="stats-item__value">{{ stats.positiveRate }}</div>
            <div class="stats-item__label">好评率</div>
          </div>
          <div class="stats-item">
            <div class="stats-item__value">{{ stats.totalOrders }}</div>
            <div class="stats-item__label">成功订单</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 筛选栏 -->
    <section class="filter-section" aria-label="评论筛选">
      <div class="container">
        <div class="filter-bar">
          <div class="filter-bar__left">
            <span class="filter-bar__label">筛选：</span>
            <select class="filter-bar__select" v-model="ratingFilter" @change="handleFilterChange">
              <option value="">全部评分</option>
              <option value="5">5星好评</option>
              <option value="4">4星评论</option>
              <option value="3">3星评论</option>
            </select>
            <select class="filter-bar__select" v-model="vehicleFilter" @change="handleFilterChange">
              <option value="">全部车型</option>
              <option value="suv">SUV</option>
              <option value="sedan">轿车</option>
              <option value="mpv">商务MPV</option>
              <option value="electric">纯电动</option>
            </select>
            <select class="filter-bar__select" v-model="sortBy" @change="handleSortChange">
              <option value="latest">最新发布</option>
              <option value="highest">评分最高</option>
              <option value="helpful">最有帮助</option>
            </select>
          </div>
          <div class="filter-bar__right">
            <span class="filter-bar__count">共 <span>{{ total }}</span> 条评论</span>
          </div>
        </div>
      </div>
    </section>
    <!-- 评论展示区 -->
    <section class="reviews-section" aria-label="评论列表">
      <div class="container">
        <div class="review-grid" v-if="reviews.length">
          <article v-for="review in reviews" :key="review.id" class="review-card">
            <span v-if="review.featured" class="review-card__badge">精选评论</span>
            <div class="review-card__header">
              <img :src="review.avatar" :alt="review.name + '头像'" class="review-card__avatar" loading="lazy"/>
              <div class="review-card__user-info">
                <h3 class="review-card__name">{{ review.name }}</h3>
                <span class="review-card__user-type">{{ review.userType }}</span>
              </div>
            </div>
            <div class="review-card__rating">
              <div class="review-card__stars" :aria-label="review.rating + '星好评'">
                <span v-for="star in 5" :key="star" :class="{ 'star-empty': star > review.rating }">★</span>
              </div>
              <span class="review-card__rating-value">{{ review.rating }}.0</span>
            </div>
            <p class="review-card__content">{{ review.content }}</p>

            <!-- 评论图片（修复后） -->
            <div v-if="review.image" class="review-images">
              <el-image
                  v-for="(img, idx) in review.image.split(',')"
                  :key="idx"
                  :src="img"
                  :preview-src-list="review.image.split(',')"
                  :initial-index="idx"
                  :preview-teleported="true"
                  fit="cover"
                  class="review-img-item"
              />
            </div>

            <div class="review-card__vehicle">
              <span>🚗</span><span>{{ review.carModel }}</span>
            </div>
            <footer class="review-card__footer">
              <small class="review-card__date">{{ review.date }}</small>
              <div class="review-card__actions">
                <button type="button" class="review-card__action" @click="likeReview(review.id)"
                        :disabled="review.liked">
                  <span>👍</span> {{ review.likes }}
                </button>
              </div>
            </footer>
          </article>
        </div>
        <div v-else class="empty-state" style="text-align: center; padding: 60px;">暂无评论</div>

        <!-- 加载更多按钮 -->
        <div class="load-more" v-if="reviews.length && reviews.length < total">
          <button type="button" class="load-more__btn" @click="loadMore" :disabled="loadingMore">
            {{ loadingMore ? '加载中...' : '加载更多评论' }}
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import {onMounted, ref, watch} from 'vue';
import {ElMessage} from 'element-plus';
import {useAppStore} from '@/stores/app';
import {mainRequest} from '@/api';

const appStore = useAppStore();

// 统计信息
const stats = ref({
  avgRating: 4.8,
  totalReviews: 2580,
  positiveRate: '98%',
  totalOrders: '15,000+'
});

// 评论列表
const reviews = ref([]);
const total = ref(0);
const loading = ref(false);
const loadingMore = ref(false);

// 筛选条件
const ratingFilter = ref('');
const vehicleFilter = ref('');
const sortBy = ref('latest');
const currentPage = ref(1);
const pageSize = 6;

// 获取统计信息
const fetchStats = async () => {
  try {
    stats.value = await mainRequest.get('/reviews/stats');
  } catch (error) {
    ElMessage.error(error||'获取统计失败');
  }
};

// 获取评论列表
const fetchReviews = async (page = 1, append = false) => {
  if (append) {
    loadingMore.value = true;
  } else {
    loading.value = true;
    reviews.value = [];
  }

  try {
    const params = {
      page,
      size: pageSize,
      rating: ratingFilter.value || undefined,
      vehicle: vehicleFilter.value || undefined,
      sortBy: sortBy.value
    };
    const data = await mainRequest.get('/reviews', {params});
    if (append) {
      reviews.value.push(...data.records);
    } else {
      reviews.value = data.records;
    }
    total.value = data.total;
    currentPage.value = data.current;
  } catch (error) {
    ElMessage.error(error||'加载评论失败');
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// 筛选变化
const handleFilterChange = () => {
  fetchReviews(1);
};

// 排序变化
const handleSortChange = () => {
  fetchReviews(1);
};

// 加载更多
const loadMore = () => {
  if (currentPage.value * pageSize < total.value) {
    fetchReviews(currentPage.value + 1, true);
  }
};

// 点赞
const likeReview = async (id) => {
  if (!appStore.token) {
    ElMessage.warning('请先登录');
    return;
  }
  try {
    await mainRequest.post(`/reviews/${id}/like?userId=${appStore.userInfo.id}`);
    const review = reviews.value.find(r => r.id === id);
    if (review) {
      review.likes += 1;
      review.liked = true;
    }
  } catch (error) {
    ElMessage.error(error||'点赞失败');
  }
};

// 监听筛选条件变化
watch([ratingFilter, vehicleFilter, sortBy], () => {
  fetchReviews(1);
});

onMounted(() => {
  fetchStats();
  fetchReviews();
});
</script>

<style scoped>
/* ========== 布局特有样式（保留） ========== */

/* 统计概览区 */
.stats-section {
  margin-top: 70px;
  padding: 40px 0;
  background: var(--white);
  border-bottom: 1px solid var(--border-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
  text-align: center;
}

.stats-item {
  padding: 20px;
}

.stats-item__value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
}

.stats-item__label {
  font-size: 0.95rem;
  color: var(--text-light);
  margin-top: 8px;
}

.stats-item__stars {
  color: var(--accent-color);
  font-size: 1.2rem;
  margin-top: 5px;
}

/* 筛选栏 */
.filter-section {
  padding: 25px 0;
  background: var(--white);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 70px;
  z-index: 100;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.filter-bar__left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-bar__label {
  font-weight: 600;
  color: var(--text-dark);
}

.filter-bar__select {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  background: var(--white);
  cursor: pointer;
  transition: var(--transition);
}

.filter-bar__select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.filter-bar__right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.filter-bar__count {
  font-size: 0.9rem;
  color: var(--text-light);
}

.filter-bar__count span {
  font-weight: 700;
  color: var(--primary-color);
}

/* 评论展示区 */
.reviews-section {
  padding: 60px 0;
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.review-card {
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 30px;
  transition: var(--transition);
  border: 1px solid var(--border-color);
  position: relative;
}

.review-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-5px);
}

.review-card__header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.review-card__avatar {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  object-fit: cover;
  border: 3px solid var(--primary-light);
  transition: var(--transition);
}

.review-card:hover .review-card__avatar {
  border-color: var(--primary-color);
}

.review-card__user-info {
  flex: 1;
}

.review-card__name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 4px;
}

.review-card__user-type {
  font-size: 0.85rem;
  color: var(--text-light);
}

.review-card__rating {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.review-card__stars {
  font-size: 1.2rem;
  color: var(--accent-color);
  letter-spacing: 2px;
}

.review-card__stars .star-empty {
  color: #ddd;
}

.review-card__rating-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-dark);
  background: var(--primary-light);
  padding: 2px 8px;
  border-radius: 4px;
}

.review-card__content {
  color: var(--text-dark);
  font-size: 0.95rem;
  line-height: 1.7;
  margin-bottom: 20px;
  position: relative;
}

.review-card__content::before {
  content: '"';
  position: absolute;
  top: -10px;
  left: -5px;
  font-size: 3rem;
  color: var(--primary-light);
  font-family: Georgia, serif;
  line-height: 1;
}

.review-card__vehicle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-light);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--text-light);
  margin-bottom: 15px;
}

.review-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid var(--border-color);
}

.review-card__date {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.review-card__actions {
  display: flex;
  gap: 15px;
}

.review-card__action {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  color: var(--text-light);
  cursor: pointer;
  transition: var(--transition);
  background: none;
  border: none;
}

.review-card__action:hover:not(:disabled) {
  color: var(--primary-color);
}

.review-card__action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.review-card__badge {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 4px 10px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  color: var(--text-dark);
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 20px;
}

/* 评论图片区域 */
.review-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.review-img-item {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

/* 加载更多按钮 */
.load-more {
  text-align: center;
  margin-top: 50px;
}

.load-more__btn {
  padding: 14px 40px;
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.load-more__btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: var(--white);
}

.load-more__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .review-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .review-grid {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-bar__left,
  .filter-bar__right {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .stats-item__value {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .review-card__header {
    flex-direction: column;
    text-align: center;
  }

  .review-card__footer {
    flex-direction: column;
    gap: 10px;
  }
}
</style>