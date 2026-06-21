<template>
  <main role="main">
    <div class="main-content">
      <section class="car-listing">
        <!-- 搜索栏 -->
        <div class="search-bar">
          <div class="search-bar__input-wrapper">
            <el-input
                v-model="searchKeyword"
                placeholder="搜索车型名称、品牌..."
                clearable
                @keyup.enter="handleSearch"
            />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button type="primary" @click="handleReset">重置</el-button>
          </div>
        </div>

        <!-- 列表 -->
        <div v-if="carStore.listLoading" class="loading">加载中...</div>
        <div v-else-if="carStore.listError" class="error">加载失败：{{ carStore.listError }}</div>
        <div v-else class="car-grid">
          <template v-if="carStore.list.length">
            <CarCard
                v-for="car in carStore.list"
                :key="car.id"
                :car="car"
            />
          </template>
          <div v-else class="empty-state-wrapper">
            <el-empty :image-size="200" description="暂无车辆" />
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-container" v-if="carStore.listTotal > 0">
          <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="carStore.listTotal"
              :page-sizes="[10, 20, 50, 100]"
              layout="prev, pager, next, sizes, jumper"
              background
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
          />
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useCarStore } from '@/stores/car'
import CarCard from '@/components/app/CarCard.vue'
import { useRouter } from 'vue-router'

const carStore = useCarStore()
const router = useRouter()

const searchKeyword = ref(carStore.listParams.keyword)
const currentPage = ref(carStore.listParams.page)
const pageSize = ref(carStore.listParams.size)

const handleSearch = () => carStore.searchList(searchKeyword.value)
const handleReset = () => {
  searchKeyword.value = ''
  carStore.resetListSearch()
}
const handlePageChange = (page) => {
  currentPage.value = page
  carStore.changeListPage(page)
}
const handleSizeChange = (size) => {
  pageSize.value = size
  carStore.changeListSize(size)
}

// 同步 store 参数变化 → 本地变量（用于分页器 v-model）
watch(() => carStore.listParams.page, p => currentPage.value = p)
watch(() => carStore.listParams.size, s => pageSize.value = s)

onMounted(() => {
  if (carStore.list.length === 0) {
    carStore.fetchList()
  }
})
</script>

<style scoped>
.main-content {
  display: grid;
  flex-direction: column;
  align-items: center;
  margin-top: 70px;
  padding-left: 5%;
  padding-right: 5%;
}

.car-listing {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.search-bar {

  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
  margin-top: 20px;
}

.search-bar__input-wrapper {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: center;
}

.search-bar__input {
  flex: 1;
}

.search-bar__input :deep(.el-input__wrapper) {
  height: 40px;
  padding: 0 12px;
  box-sizing: border-box;
}

.search-bar__input :deep(.el-input__inner) {
  height: 40px;
  line-height: 40px;
}

.search-bar__input-wrapper .el-button {
  width: 100px;
  height: 40px;
  padding: 0;
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.search-bar__select {
  width: 150px;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background-color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  flex-shrink: 0;
  box-sizing: border-box;
  line-height: 40px;
  vertical-align: middle;
}

.search-bar__select:focus-visible {
  outline: none;
  border-color: var(--primary-color);
}

.card-header .el-button {
  padding: 12px 30px;
  font-size: 1rem;
  font-weight: 600;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  margin-bottom: 30px;
}

:deep(.el-pagination.is-background .el-pager li:not(.disabled).active) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.el-pagination.is-background .el-pager li:not(.disabled):hover) {
  color: var(--primary-color);
}

:deep(.el-pagination .btn-prev:hover, .el-pagination .btn-next:hover) {
  color: var(--primary-color);
}

.filter-detail-card {
  margin: 0 0 20px 0;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  background-color: var(--white);
  overflow: hidden;
}

.price-range {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-range__separator {
  color: var(--text-light);
}

.price-range__unit {
  color: var(--text-light);
  font-size: 0.9rem;
  margin-left: 5px;
}

.car-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.empty-state-wrapper {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 300px;
}

:deep(.el-card) {
  border: none;
  background: transparent;
}

:deep(.el-checkbox__label) {
  color: var(--text-dark);
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-input-number) {
  width: 120px;
}

:deep(.el-button--primary) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.el-button--primary:hover) {
  background-color: var(--primary-dark);
  border-color: var(--primary-dark);
}

:deep(.el-button) {
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .price-range {
    flex-wrap: wrap;
  }
  .car-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}
</style>