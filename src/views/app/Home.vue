<template>
  <main role="main">
    <!-- 英雄区域 -->
    <section id="home" class="hero">
      <div class="hero__content">
        <h1 class="hero__title">开启您的非凡旅程<br/>从 {{ appStore.appConfig?.platformName || "车辆" }} 开始</h1>
        <p class="hero__subtitle">全城最低价，车型最全，手续最简。立即预订，享受无缝租车体验。</p>
      </div>
    </section>

    <!-- 热门车型 -->
    <section id="fleet" class="fleet" aria-labelledby="fleet-title">
      <div class="container">
        <h2 id="fleet-title" class="fleet__title">热门车型推荐</h2>
        <p class="fleet__subtitle">无论您是商务出行还是家庭旅游，总有一款适合您</p>

        <div v-if="carStore.homeLoading.hot" class="loading">加载中...</div>
        <div v-else-if="carStore.hotCars.length === 0" class="empty">暂无热门车型</div>
        <div v-else class="fleet__grid">
          <CarCard
              v-for="car in carStore.hotCars"
              :key="car.id"
              :car="car"
          />
        </div>
      </div>
    </section>

    <!-- 新车推荐 -->
    <section class="fleet" aria-labelledby="new-fleet-title">
      <div class="container">
        <h2 id="new-fleet-title" class="fleet__title">新车推荐</h2>
        <p class="fleet__subtitle">最新上架，尝鲜体验</p>

        <div v-if="carStore.homeLoading.new" class="loading">加载中...</div>
        <div v-else-if="carStore.newCars.length === 0" class="empty">暂无新车</div>
        <div v-else class="fleet__grid">
          <CarCard
              v-for="car in carStore.newCars"
              :key="car.id"
              :car="car"
          />
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import CarCard from "@/components/app/CarCard.vue"
import { useCarStore } from '@/stores/car'
import {useAppStore} from "@/stores/app.js";

const appStore = useAppStore()
const carStore = useCarStore()

onMounted(() => {
  carStore.fetchHotCars()
  carStore.fetchNewCars()
})
</script>

<style scoped>
section {
  padding: 80px 0;
}

/* === 英雄区域 === */
.hero {
  margin-top: 70px;
  height: 55vh;
  min-height: 600px;
  background: linear-gradient(rgba(0, 30, 80, 0.6), rgba(0, 30, 80, 0.4));
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--white);
}

.hero__content {
  max-width: 800px;
  padding: 20px;
}
.loading, .empty {
  text-align: center;
  padding: 40px 0;
  color: var(--text-light);
}
.hero__title {
  font-size: 3.5rem;
  margin-bottom: 20px;
  line-height: 1.2;
  color: white;
}

.hero__subtitle {
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.9;
}

/* === 车型展示区 === */
.fleet__title {
  text-align: center;
  font-size: 2.2rem;
  margin-bottom: 1rem;
  color: var(--primary-dark);
}

.fleet__subtitle {
  text-align: center;
  color: var(--text-light);
  margin-bottom: 3rem;
}

.fleet__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
}

/* === 响应式设计 === */
@media (max-width: 768px) {
  .hero__title {
    font-size: 2.5rem;
  }
}
</style>