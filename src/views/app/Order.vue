<template>
  <main role="main">
    <div class="container">
      <div class="booking-main" v-loading="loading">
        <div class="booking-form">
          <!-- 车辆信息摘要 -->
          <div class="form-section">
            <h3 class="form-section__title"><span>1</span> 已选车辆</h3>
            <div class="car-summary">
              <img :src="formatImg(car.image)" :alt="car.modelName" class="car-summary__image" loading="lazy" />
              <div class="car-summary__info">
                <div class="car-summary__name">{{ car.modelName }}</div>
                <div class="car-summary__price">¥{{ car.dailyRent }}/天</div>
              </div>
            </div>
          </div>

          <!-- 行程信息 -->
          <div class="form-section">
            <h3 class="form-section__title"><span>2</span> 行程信息</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="pickup-location" class="form-group__label">取车地点</label>
                <select id="pickup-location" class="form-group__select" v-model="pickupLocation">
                  <option v-for="station in stations" :key="station.id" :value="station.address">
                    {{ station.name }} ({{ station.address }})
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="return-location" class="form-group__label">还车地点</label>
                <select id="return-location" class="form-group__select" v-model="returnLocation">
                  <option v-for="station in stations" :key="station.id" :value="station.address">
                    {{ station.name }} ({{ station.address }})
                  </option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="pickup-date" class="form-group__label">取车日期</label>
                <input type="date" id="pickup-date" class="form-group__input" v-model="pickupDate" />
              </div>
              <div class="form-group">
                <label for="pickup-time" class="form-group__label">取车时间</label>
                <select id="pickup-time" class="form-group__select" v-model="pickupTime">
                  <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="return-date" class="form-group__label">还车日期</label>
                <input type="date" id="return-date" class="form-group__input" v-model="returnDate" />
              </div>
              <div class="form-group">
                <label for="return-time" class="form-group__label">还车时间</label>
                <select id="return-time" class="form-group__select" v-model="returnTime">
                  <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 增值服务 -->
          <div class="form-section">
            <h3 class="form-section__title"><span class="form-section__span">3</span> 增值服务 <span class="badge-info">可选</span></h3>
            <div class="service-options">
              <label v-for="service in services" :key="service.id" class="service-option">
                <input type="checkbox" class="service-option__checkbox" v-model="service.selected" />
                <div class="service-option__info">
                  <div class="service-option__name">{{ service.name }}</div>
                  <div class="service-option__desc">{{ service.description }}</div>
                </div>
                <div class="service-option__price">+¥{{ service.price }}/天</div>
              </label>
            </div>
          </div>

          <!-- 联系人信息 -->
          <div class="form-section">
            <h3 class="form-section__title"><span>4</span> 联系人信息</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="fullname" class="form-group__label">姓名</label>
                <input type="text" id="fullname" class="form-group__input" v-model="contact.realName" readonly disabled />
              </div>
              <div class="form-group">
                <label for="phone" class="form-group__label">手机号码</label>
                <input type="tel" id="phone" class="form-group__input" v-model="contact.iphone" readonly disabled />
              </div>
            </div>
            <div class="form-group">
              <label for="email" class="form-group__label">电子邮箱</label>
              <input type="email" id="email" class="form-group__input" v-model="contact.email" readonly disabled />
            </div>
            <div class="form-group" style="margin-top: 15px">
              <label class="form-group__label" style="flex-direction: row; gap: 10px; align-items: center">
                <input type="checkbox" v-model="agreeTerms" /> 同意《用户租车协议》及《隐私政策》
              </label>
            </div>
          </div>
        </div>

        <div class="price-summary" v-loading="loadingEstimate">
          <h3 class="price-summary__title">费用明细</h3>

          <!-- 费用项列表（正数） -->
          <div v-for="fee in estimate?.feeItems" :key="fee.key" class="price-item">
            <span class="price-item__label">{{ fee.description }}</span>
            <span class="price-item__value">¥{{ fee.amount }}</span>
          </div>

          <!-- 小计（原价总额） -->
          <div class="price-item total">
            <span class="price-item__label">小计</span>
            <span class="price-item__value">¥{{ estimate?.originalTotal || 0 }}</span>
          </div>
          <div class="price-item total"></div>
          <!-- 优惠项列表（负数，绿色） -->
          <div
              v-for="discount in estimate?.discountItems"
              :key="discount.key"
              class="price-item "
              style="color: var(--success-color)"
          >
            <span class="price-item__label" v-if="discount.amount !== 0">{{ discount.description }}</span>
            <span class="price-item__value" v-if="discount.amount !== 0">-¥{{ discount.amount }}</span>
          </div>

          <!-- 应付总额 -->
          <div class="price-item total" style="border-top: 1px solid var(--border-color); padding-top: 10px; font-weight: 700;">
            <span class="price-item__label">应付总额</span>
            <span class="price-item__value" style="font-size: 1.5rem; color: var(--primary-color)">
      ¥{{ estimate?.finalTotal || 0 }}
    </span>
          </div>

          <button class="btn-primary" @click="submitOrder" :disabled="!agreeTerms || submitting">
            {{ submitting ? '提交中...' : '提交订单' }}
          </button>
          <p class="deposit-tip">应付总额已包含押金，支付时一并扣除</p>
          <div class="policy-text">点击提交即表示同意 <a href="#">租车协议</a> 和 <a href="#">取消政策</a></div>
        </div>


      </div>
    </div>
  </main>
</template>

<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {ElMessage} from 'element-plus';
import {useAppStore} from '@/stores/app.js';
import {mainRequest} from '@/api/index.js';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

const loading = ref(false);
const submitting = ref(false);
const loadingEstimate = ref(false);

// 车辆信息
const car = ref({});

// 网点数据
const stations = ref([]);
const pickupLocation = ref('');
const returnLocation = ref('');
const pickupDate = ref('');
const pickupTime = ref('09:00');
const returnDate = ref('');
const returnTime = ref('18:00');
const timeOptions = ['08:00', '09:00', '10:00', '14:00', '18:00'];

// 增值服务
const services = ref([]);

// 联系人
const contact = ref({});
const agreeTerms = ref(true);

// 试算结果
const estimate = ref(null);

const formatImg = (img)=>{
  if(img===undefined) return
  return img[0]
}

// 辅助函数：格式化日期
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 获取网点列表
const fetchStations = async () => {
  try {
    stations.value = await mainRequest.get('/stations/active');
    if (stations.value.length > 0) {
      pickupLocation.value = stations.value[0].address;
      returnLocation.value = stations.value[0].address;
    }
  } catch (error) {
    ElMessage.error(error || '获取网点列表失败');
  }
};

// 获取车辆详情
const fetchCarDetail = async (carId) => {
  try {
    car.value = await mainRequest.get(`/cars/${carId}`)
  } catch (error) {
    ElMessage.error(error||'获取车辆信息失败');
  }
};

// 获取增值服务
const fetchServices = async () => {
  try {
    const data = await mainRequest.get('/services');
    services.value = data.map(s => ({ ...s, selected: false }));
  } catch (error) {
    ElMessage.error(error||'获取服务列表失败');
  }
};

// 刷新用户信息（角色等）
const refreshUser = async () => {
  const res = await mainRequest.get('/user', { params: { id: appStore.userInfo.id } });
  appStore.role = res.role;
};

// 计算租车天数
const rentalDays = computed(() => {
  if (!pickupDate.value || !returnDate.value) return 1;
  const start = new Date(pickupDate.value);
  const end = new Date(returnDate.value);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
});

// 选中的服务
const selectedServices = computed(() => services.value.filter(s => s.selected));

// 调用后端试算接口
const fetchEstimate = async () => {
  if (!car.value.carId || !pickupDate.value || !returnDate.value) return;
  loadingEstimate.value = true;
  try {
    const estimateData = {
      carId: car.value.carId,
      totalDays: rentalDays.value,
      serviceIds: selectedServices.value.map(s => s.id)
    };
    estimate.value = await mainRequest.post('/orders/estimate', estimateData, {
      params: {userId: appStore.userInfo.id}
    });
  } catch (error) {
    ElMessage.error(error||'费用计算失败');
  } finally {
    loadingEstimate.value = false;
  }
};

// 监听依赖变化，自动试算
watch([() => car.value.carId, rentalDays, selectedServices], () => {
  fetchEstimate();
}, { immediate: true });

// 提交订单
const submitOrder = async () => {
  if (!agreeTerms.value) return;

  submitting.value = true;
  try {
    const orderData = {
      carId: car.value.carId,
      pickupLocation: pickupLocation.value,
      returnLocation: returnLocation.value,
      rentStartTime: `${pickupDate.value} ${pickupTime.value}:00`,
      rentEndTime: `${returnDate.value} ${returnTime.value}:00`,
      totalDays: rentalDays.value,
      serviceIds: selectedServices.value.map(s => s.id),
    };
    const orderId = await mainRequest.post('/orders', orderData, {
      params: { userId: appStore.userInfo.id }
    });
    ElMessage.success('订单提交成功');
    router.push(`/order/${orderId}`);
  } catch (error) {
    ElMessage.error(error || '提交失败');
  } finally {
    submitting.value = false;
  }
};

// 初始化
onMounted(async () => {
  if (!appStore.token) {
    ElMessage.warning('请先登录');
    await router.push('/');
    return;
  }

  const carId = route.query.carId;
  if (!carId) {
    ElMessage.error('未指定车辆');
    await router.push('/fleet');
    return;
  }

  loading.value = true;
  try {
    await refreshUser();
    await fetchStations();
    await Promise.all([fetchCarDetail(carId), fetchServices()]);

    // 设置默认日期
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    pickupDate.value = formatDate(tomorrow);
    returnDate.value = formatDate(threeDaysLater);

    // 获取用户联系人信息
    contact.value = await mainRequest.get('/user', {params: {id: appStore.userInfo.id}})

    console.log(contact.value)
  } catch (error) {
    ElMessage.error(error)
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.container {
  width: 90%;
  max-width: 1200px;
  margin: 70px auto 0;
  padding: 0 15px;
}

.deposit-tip {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  margin-top: 5px;
}
.page-header__breadcrumb a {
  color: var(--white);
  text-decoration: none;
}
.page-header__breadcrumb a:hover {
  text-decoration: underline;
}
.booking-main {
  padding: 40px 0;
}
.booking-form {
  background: var(--white);
  border-radius: var(--radius);
  padding: 30px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 30px;
}
.form-section {
  margin-bottom: 35px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 25px;
}
.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.form-section__title {
  font-size: 1.3rem;
  color: var(--primary-dark);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.form-section__span {
  background: var(--primary-light);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: var(--primary-color);
  font-weight: 600;
}
.car-summary {
  display: flex;
  gap: 20px;
  background: var(--bg-light);
  border-radius: var(--radius);
  padding: 20px;
  border: 1px solid var(--border-color);
}
.car-summary__image {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background-color: #eee;
}
.car-summary__info {
  flex: 1;
}
.car-summary__name {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-dark);
}

.car-summary__price {
  margin-top: 10px;
  font-weight: 700;
  color: var(--primary-color);
  font-size: 1.2rem;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.form-group {
  display: flex;
  flex-direction: column;
}
.form-group__label {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-dark);
  font-size: 0.95rem;
}
.form-group__input,
.form-group__select {
  padding: 12px 15px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  transition: var(--transition);
  background-color: var(--white);
}
.form-group__input:focus,
.form-group__select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 86, 179, 0.1);
}
.service-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.service-option {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: var(--bg-light);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: var(--transition);
}
.service-option:hover {
  background: var(--primary-light);
  border-color: var(--primary-color);
}
.service-option__checkbox {
  width: 20px;
  height: 20px;
  accent-color: var(--primary-color);
}
.service-option__info {
  flex: 1;
}
.service-option__name {
  font-weight: 600;
  color: var(--text-dark);
}
.service-option__desc {
  font-size: 0.85rem;
  color: var(--text-light);
}
.service-option__price {
  font-weight: 700;
  color: var(--primary-color);
}
.price-summary {
  background: var(--white);
  border-radius: var(--radius);
  padding: 30px;
  box-shadow: var(--shadow-md);
  margin-top: 30px;
}
.price-summary__title {
  font-size: 1.3rem;
  color: var(--primary-dark);
  margin-bottom: 25px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--border-color);
}
.price-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  color: var(--text-dark);
}
.price-item.total {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 2px dashed var(--border-color);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--primary-color);
}
.price-item__label {
  color: var(--text-light);
}
.price-item__value {
  font-weight: 600;
}
.btn-primary {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: var(--white);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  margin-top: 25px;
  box-shadow: 0 6px 14px rgba(0, 86, 179, 0.3);
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 86, 179, 0.4);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
.policy-text {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 15px;
  text-align: center;
}
.policy-text a {
  color: var(--primary-color);
  text-decoration: none;
}
.badge-info {
  background-color: var(--primary-light);
  color: var(--primary-color);
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}
@media (max-width: 768px) {
  .page-header__title {
    font-size: 1.6rem;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
  .car-summary {
    flex-direction: column;
    align-items: flex-start;
  }
  .car-summary__image {
    width: 100%;
    height: 150px;
  }
}
</style>