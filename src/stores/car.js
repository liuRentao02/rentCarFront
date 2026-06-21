import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { mainRequest } from '@/api'
import {ElMessage} from "element-plus";

export const useCarStore = defineStore('car', () => {
    // ==================== 首页相关 ====================
    const hotCars = ref([])
    const newCars = ref([])
    const homeLoading = reactive({ hot: false, new: false })

    const fetchHotCars = async () => {
        if (hotCars.value.length > 0) return   // 缓存
        homeLoading.hot = true
        try {
            hotCars.value = await mainRequest.get('/cars/hot')
        } catch (e) {
            ElMessage.error(e||'获取热门车型失败')
        } finally {
            homeLoading.hot = false
        }
    }

    const fetchNewCars = async () => {
        if (newCars.value.length > 0) return
        homeLoading.new = true
        try {
            newCars.value = await mainRequest.get('/cars/new')
        } catch (e) {
            ElMessage.error(e||'获取新车推荐失败')
        } finally {
            homeLoading.new = false
        }
    }

    // ==================== 列表页相关 ====================
    const list = ref([])                 // 当前页数据
    const listTotal = ref(0)
    const listLoading = ref(false)
    const listError = ref(null)
    const listParams = reactive({
        keyword: '',
        page: 1,
        size: 20,
    })

    const fetchList = async () => {
        listLoading.value = true
        listError.value = null
        try {
            const params = {
                page: listParams.page,
                size: listParams.size,
                keyword: listParams.keyword,
            }
            const data = await mainRequest.get('/cars/list', { params })
            list.value = data.records || []
            listTotal.value = data.total
        } catch (e) {
            listError.value = e || '加载失败'
        } finally {
            listLoading.value = false
            console.log(list.value)
        }
    }

    const searchList = (keyword) => {
        listParams.keyword = keyword
        listParams.page = 1
        return fetchList()
    }

    const resetListSearch = () => {
        listParams.keyword = ''
        listParams.page = 1
        return fetchList()
    }

    const changeListPage = (page) => {
        listParams.page = page
        return fetchList()
    }

    const changeListSize = (size) => {
        listParams.size = size
        listParams.page = 1
        return fetchList()
    }

    // 清空列表（切出页面时可不清空，便于返回保持状态）
    const clearList = () => {
        list.value = []
        listTotal.value = 0
        listError.value = null
        Object.assign(listParams, { keyword: '', page: 1, size: 20 })
    }

    return {
        // 首页
        hotCars,
        newCars,
        homeLoading,
        fetchHotCars,
        fetchNewCars,
        // 列表
        list,
        listTotal,
        listLoading,
        listError,
        listParams,
        fetchList,
        searchList,
        resetListSearch,
        changeListPage,
        changeListSize,
        clearList,
    }
})