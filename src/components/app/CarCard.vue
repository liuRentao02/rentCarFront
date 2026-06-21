<template>
  <article
      class="car-card"
      tabindex="0"
      :aria-labelledby="`car-${car.id}-title`"
      @click="handleCardClick"
  >
    <figure class="car-card__figure">
      <el-image
          :src="primaryImage"
          :alt="car.brand_name"
          fit="cover"
          class="car-card__image"
          loading="lazy"
      >
        <template #error>
          <div class="image-error">
            <el-icon><PictureFilled /></el-icon>
          </div>
        </template>
      </el-image>
    </figure>

    <div class="car-card__body">
      <h3 :id="`car-${car.id}-title`" class="car-card__title">{{ car.brandName }}</h3>
      <span class="car-card__category">{{ car.category }}</span>

      <!-- 规格展示 -->
      <div class="car-card__specs" aria-label="车辆规格">
        <span v-for="spec in displaySpecs" :key="spec.label">
          <el-icon v-if="spec.icon" class="spec-icon"><component :is="spec.icon" /></el-icon>
          {{ spec.value }}
        </span>
      </div>

      <div class="car-card__footer">
        <p class="car-card__price">
          <span class="car-card__price-value">¥{{ car.dailyRent }}/天</span>
          <span v-if="car.originalPrice" class="car-card__price-original">
            ¥{{ car.originalPrice }}
          </span>
        </p>
        <button
            type="button"
            class="car-card__btn"
            :aria-label="`预订 ${car.brand_name}`"
            @click.stop="handleCardClick"
        >
          立即预订
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { PictureFilled } from '@element-plus/icons-vue'

const props = defineProps({
  car: {
    type: Object,
    required: true
  }
})
const router = useRouter()

// 主图片（处理可能的多个图片）
const primaryImage = computed(() => {
  if (!props.car.imageUrls) return ''
  return props.car.imageUrls.includes(',')
      ? props.car.imageUrls.split(',')[0].trim()
      : props.car.imageUrls
})

// 规格展示（支持图标）
const displaySpecs = computed(() => {
  const specs = []
  if (props.car.specs) {
    if (props.car.specs.range) specs.push({ label: '续航', value: props.car.specs.range })
    if (props.car.specs.seats) specs.push({ label: '座位', value: props.car.specs.seats })
    if (props.car.specs.transmission) specs.push({ label: '变速箱', value: props.car.specs.transmission })
  }
  return specs
})

// 点击卡片查看详情
const handleCardClick = () => {
  router.push(`/car/${props.car.carId}`)
}
</script>

<style scoped>
/* 保持原有样式，添加新样式 */
.car-card {
  background: var(--white);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  border: 1px solid #eee;
  cursor: pointer;
}

.car-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-5px);
}

.car-card__figure {
  position: relative;
  margin: 0;
  background-color: #f0f0f0;
}

.car-card__image {
  height: 200px;
  width: 100%;
  object-fit: cover;
}

/* 图片加载失败样式 */
.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  background-color: #f5f7fa;
  color: #c0c4cc;
  font-size: 40px;
}

.car-card__body {
  padding: 20px;
}

.car-card__title {
  font-size: 1.25rem;
  margin-bottom: 5px;
  color: var(--text-dark);
}

.car-card__category {
  font-size: 0.85rem;
  color: var(--text-light);
  margin-bottom: 15px;
  display: block;
}

.car-card__specs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  font-size: 0.9rem;
  color: var(--text-light);
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  padding: 10px 0;
  gap: 10px;
}

.spec-icon {
  margin-right: 4px;
  vertical-align: middle;
}

.car-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.car-card__price-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-color);
}

.car-card__price-original {
  font-size: 0.85rem;
  color: #999;
  text-decoration: line-through;
  margin-left: 8px;
}

.car-card__btn {
  padding: 8px 20px;
  font-size: 0.9rem;
  background-color: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.car-card__btn:hover {
  background-color: var(--primary-dark);
  transform: scale(1.05);
}

.car-card__badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 1;
}

.car-card__badge--hot {
  background-color: #ff4757;
  color: white;
}

.car-card__badge--new {
  background-color: #2ed573;
  color: white;
}

.car-card__badge--discount {
  background-color: #ffa502;
  color: white;
}

/* 屏幕阅读器专用 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>