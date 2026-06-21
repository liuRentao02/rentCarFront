<template>
  <!-- ========== 页面标题区 ========== -->
  <section class="page-header" aria-label="页面标题">
    <div class="container">
      <h1 class="page-header__title">车型详情 · {{ car.modelName }}</h1>
      <nav class="page-header__breadcrumb" aria-label="面包屑导航">
        <router-link to="/">首页</router-link> /
        <router-link to="/fleet">车型列表</router-link> /
        <span>{{ car.modelName }}</span>
      </nav>
    </div>
  </section>

  <main role="main">
    <div v-if="!car">
      <el-empty />
    </div>
    <div v-else class="container">
      <div class="detail-layout">
        <div class="carousel-wrapper">
          <el-carousel indicator-position="outside" height="700px">
            <el-carousel-item v-for="(item, index) in car.image" :key="index">
              <el-image :src="item"
                        :preview-src-list="item.split(',')"
                        :preview-teleported="true"
                        :alt="car.modelName + ' 图片'"
                        fit="cover"
                        style="border-radius: 10px" />
            </el-carousel-item>
          </el-carousel>
        </div>
        <div class="booking-panel-wrapper">
          <div class="booking-panel">
            <h2 class="vehicle-title">{{ car.modelName }}</h2>
            <div class="vehicle-subtitle">{{ car.subtitle }}</div>

            <div class="d-flex align-items-baseline">
              <span class="price-tag">¥{{ car.dailyRent }}</span>
              <span class="price-unit">/天</span>
            </div>

            <div class="key-specs">
              <div v-for="(spec, index) in car.keySpecs" :key="index" class="spec-item">
                <span class="spec-icon">{{ spec.icon }}</span>
                <span class="spec-label">{{ spec.label }}</span>
              </div>
            </div>

            <button type="button" class="btn-rent" @click="handleRent">立即租借 →</button>

            <p class="text-muted mt-3 mb-0 small">
              <span class="text-primary">✓</span> 少量押金 · 极速取车 · 高端享受
            </p>
          </div>
        </div>
      </div>

      <!-- 第二部分：详细信息卡片 (技术参数表格 + 描述) -->
      <div class="details-card">
        <h3 class="details-card__title">技术参数 & 车辆描述</h3>

        <div class="table-responsive">
          <table class="spec-table">
            <tbody>
            <tr v-for="item in car.techSpecs" :key="item.label">
              <td>{{ item.label }}</td>
              <td>{{ item.value }}</td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="vehicle-description">
          <div class="d-flex flex-wrap gap-2 mt-4" style="margin-top: 10px;">
            <span class="badge bg-light text-dark p-3" style="border-radius: 30px">🚀 极速取车</span>
            <span class="badge bg-light text-dark p-3" style="border-radius: 30px">🛡️ 全面保障</span>
            <span class="badge bg-light text-dark p-3" style="border-radius: 30px">💎 高端车况</span>
            <span class="badge bg-light text-dark p-3" style="border-radius: 30px">💰 学生认证享优惠</span>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {mainRequest} from '@/api/index.js';
import {ElMessage} from "element-plus";

const route = useRoute();
const router = useRouter();

const car = ref({})

const loading = ref(false);

const fetchCarDetail = async (id) => {
  loading.value = true;
  try {
    car.value = await mainRequest.get(`/cars/${id}`);
  } catch (error) {
    ElMessage.error(error||'获取车辆详情失败');
  } finally {
    loading.value = false;
  }
};

const handleRent = () => {
  router.push(`/order?carId=${car.value.carId}`);
};

onMounted(() => {
  const id = route.params.id;
  if (id) {
    fetchCarDetail(id);
  }
});
</script>

<style scoped>
.container {
  width: 90%;
  max-width: 1200px;
  padding: 0 15px;
  margin: 20px auto 0;
}
.page-header {
  margin-top: 70px;
  padding: 30px 0 20px;
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
.page-header__breadcrumb a {
  color: var(--white);
  text-decoration: none;
}
.page-header__breadcrumb a:hover {
  text-decoration: underline;
}
.carousel-container {
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  background-color: var(--white);
}
.carousel-item img {
  height: 400px;
  object-fit: cover;
  width: 100%;
}
.booking-panel {
  background: var(--white);
  border-radius: var(--radius);
  padding: 30px;
  box-shadow: var(--shadow-md);
  height: fit-content;
}
.vehicle-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: 0.5rem;
}
.vehicle-subtitle {
  color: var(--text-light);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 15px;
  margin-bottom: 20px;
}
.price-tag {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1.2;
}
.price-unit {
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-light);
  margin-left: 5px;
}
.key-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin: 20px 0;
  padding: 15px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}
.spec-item {
  flex: 1 0 calc(50% - 15px);
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-dark);
  font-size: 0.95rem;
}
.spec-icon {
  font-size: 1.4rem;
  background: var(--primary-light);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
}
.spec-label {
  font-weight: 500;
}
.btn-rent {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border: none;
  padding: 15px;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  width: 100%;
  transition: var(--transition);
  box-shadow: 0 6px 14px rgba(0, 86, 179, 0.3);
  margin-top: 15px;
}
.btn-rent:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 86, 179, 0.4);
  background: linear-gradient(135deg, var(--primary-dark), #002b5c);
  color: white;
}
.details-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 30px;
  box-shadow: var(--shadow-sm);
  margin: 40px 0;
}
.details-card__title {
  font-size: 1.8rem;
  color: var(--primary-dark);
  margin-bottom: 25px;
  position: relative;
  padding-bottom: 10px;
}
.details-card__title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 4px;
  background: var(--primary-color);
  border-radius: 2px;
}
.spec-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0 30px;
}
.spec-table tr {
  border-bottom: 1px solid var(--border-color);
}
.spec-table td {
  padding: 14px 12px;
  font-size: 1rem;
}
.spec-table td:first-child {
  font-weight: 600;
  width: 35%;
  background-color: var(--bg-light);
}
.spec-table td:last-child {
  color: var(--text-dark);
}
.vehicle-description {
  background: var(--bg-light);
  padding: 25px;
  border-radius: var(--radius);
  font-size: 1rem;
  line-height: 1.8;
  border-left: 5px solid var(--primary-color);
  margin-top: 30px;
}
@media (max-width: 768px) {
  .carousel-item img {
    height: 250px;
  }
  .booking-panel {
    margin-top: 20px;
  }
  .spec-item {
    flex: 1 0 100%;
  }
  .spec-table td:first-child {
    width: 45%;
  }
}
.carousel-indicators [data-bs-target] {
  background-color: var(--primary-color);
}
</style>