import axios from 'axios'
import router from '@/router'
import {useAppStore} from "@/stores/app.js";
// 创建 axios 实例（主站）
const mainRequest = axios.create({
    baseURL: "http://localhost:8080/api", // 从环境变量读取
    timeout: 10000,
})

// 创建 axios 实例（管理后台）
const adminRequest = axios.create({
    baseURL: "http://localhost:8080/api/admin",
    timeout: 10000,
})

// 请求拦截器：添加 token
const addToken = (config) => {
    const appStore = useAppStore()
    const token = appStore.token// 或从 store 获取
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
}

mainRequest.interceptors.request.use(addToken, (error) => Promise.reject(error))
adminRequest.interceptors.request.use(addToken, (error) => Promise.reject(error))

// 响应拦截器：统一处理响应数据和错误
const handleResponse = (response) => {
    const res = response.data;
    const appStore = useAppStore()
    // 根据后端约定的 code 判断请求是否成功
    if (res.code !== 200) {
        // 特殊处理：401 未授权，跳转登录
        if (res.code === 401) {
            appStore.clearUserData();
            router.push('/')
            return Promise.reject("登录过期")
        }
        return Promise.reject(res.message || 'Error')
    }
    return res.data // 直接返回 data 部分，简化调用
}

const handleError = (error) => {
    let message = error.message;
    const appStore = useAppStore()
    if (error.response) {
        switch (error.response.status) {
            case 401:
                message = '未授权，请重新登录'
                appStore.clearUserData();
                router.push('/')
                break
            case 403:
                message = '拒绝访问'
                break
            case 404:
                message = '请求地址不存在'
                break
            case 500:
                message = '服务器内部错误'
                break
            default:
                message = error.response.data.message || '未知错误'
        }
    }
    return Promise.reject(error)
}

mainRequest.interceptors.response.use(handleResponse, handleError)
adminRequest.interceptors.response.use(handleResponse, handleError)

export { mainRequest, adminRequest }