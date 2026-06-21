import { createRouter, createWebHistory } from 'vue-router'
import {useAppStore} from "@/stores/app.js";
import {mainRequest} from "@/api/index.js";
import {ElMessage} from "element-plus";

const routes = [
    {
        path: '/',
        component: () => import('@/views/layout/app.vue'),
        children: [
            {
                path: '',
                component: () => import('@/views/app/Home.vue'),
                meta: { title: '首页' }
            },
            {
                path: '/fleet',
                component: () => import('@/views/app/Fleet.vue'),
                meta: { title: ' 车型' }
            },
            {
                path: '/car/:id',
                component: () => import('@/views/app/CarDetail.vue'),
                props: true,
                meta: {  title: ' 车辆详情' }
            },
            {
                path: '/review/:id',
                component: () => import('@/views/app/SubmitReview.vue'),
                meta: { title: '发表评论' }
            },
            {
              path: '/reviews',
              component: () => import('@/views/app/Reviews.vue'),
                meta: {  title: ' 评论' }
            },
            {
                path: '/contact',
                component: () => import('@/views/app/Contact.vue'),
                meta: {  title: ' 联系' }
            },
            {
                path: '/profile',
                component: () => import('@/views/app/Profile.vue'),
                meta: { title: ' 个人中心' }
            },
            {
              path: "/password",
              component: ()=> import("@/views/app/ChangePassword.vue"),
              meta: {title: "修改密码"}
            },
            {
                path: '/profile/reviews',
                component: () => import('@/views/app/MyReviews.vue'),
                meta: { title: '我的评论' }
            },
            {
                path: "/order",
                component: () => import('@/views/app/Order.vue'),
                meta: { title: ' 订单' }
            },
            {
                path: '/order/:id',
                component: () => import('@/views/app/OrderDetail.vue'),
                meta: { title: '订单详情' }
            },
            {
                path: '/profile/orders',
                component: () => import('@/views/app/OrderList.vue'),
                meta: { title: '我的订单' }
            },
            {
                path: '/profile/notice',
                component: () => import('@/views/app/Notice.vue'),
                meta: { title: '系统公告' }
            },
            {
                path: '/pay/:id',
                component: () => import('@/views/app/Pay.vue'),
                meta: { title: '订单支付' }
            },
            {
                path: '/payment-result',
                component: () => import('@/views/app/PaymentResult.vue'),
                meta: { title: '支付结果' }
            },
            {
                path: '/profile/certification/student',
                component: () => import('@/views/app/StudentCertification.vue'),
                meta: {title: "学生认证"}
            }
        ]
    },
    {
        path: '/admin',
        component: () => import('@/views/layout/admin.vue'),
        children: [
            {
                path: '',
                component: () => import('@/views/admin/Home.vue'),
                meta: { title: '首页' }
            },
            {
                path: 'certification',
                component: () => import('@/views/admin/CertificationList.vue'),
                meta: { requiresAuth: true, role: 'admin' }
            },
            {
                path: 'vehicle',
                children: [
                    {
                        path: 'list',
                        component: () => import('@/views/admin/VehicleList.vue'),
                        meta: { title: '车辆列表' }
                    },
                    {
                        path: "carModel",
                        component: () => import('@/views/admin/VehicleModelList.vue'),
                        meta: { title: '车辆型号' }
                    },
                    {
                        path: 'maintenance',
                        component: () => import('@/views/admin/VehicleMaintenance.vue'),
                        meta: { title: '维修记录' }
                    }
                ]
            },
            {
              path: "order",
              component: () => import('@/views/admin/OrderList.vue'),
              meta: { title: '订单列表' }
            },
            {
                path: 'user',
                children: [
                    {
                        path: 'list',
                        component: () => import('@/views/admin/UserList.vue'),
                        meta: { title: '用户列表' }
                    },
                    {
                        path: 'role',
                        component: () => import('@/views/admin/RoleBenefitsList.vue'),
                        meta: { title: '用户权限管理' }
                    }
                ]
            },
            {
                path: 'contact',
                name: 'ContactMessages',
                component: () => import('@/views/admin/ContactMessageList.vue'),
                meta: { title: '留言管理', icon: 'ChatLineRound' }
            },
            {
                path: 'service',
                name: 'AdminServiceList',
                component: () => import('@/views/admin/ServiceList.vue'),
                meta: { title: '服务管理' }
            },
            {
                path: 'notice',
                name: 'AdminNoticeList',
                component: () => import('@/views/admin/Notice.vue'),
                meta: { title: '公告管理' }
            },
            {
                path: 'system',
                component: () => import('@/views/admin/System.vue'),
                meta: {
                    title: '系统管理'
                }
            },
            {
                path: 'log',
                name: "log",
                component: ()=>import("@/views/admin/Log.vue"),
                meta: {title: "日志"}
            },
            {
                path: 'station',
                name: 'AdminStationList',
                component: () => import('@/views/admin/StationList.vue'),
                meta: { title: '网点管理' }
            },
            {
                path: 'personalCenter',
                component: () => import('@/views/admin/PersonalCenter.vue'),
                meta: {
                    title: '个人中心'
                }
            },
            {
                path: 'review',
                name: 'AdminReview',
                component: () => import('@/views/admin/ReviewManage.vue'),
                meta: { title: '评论管理' }
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/error/NotFound.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        return {top: 0}
    }
})

router.beforeEach(async (to, from, next) => {
    const appStore = useAppStore()

    // 需要管理员权限的路径（/admin 及其子路由）
    if (to.path.startsWith('/admin')) {
        // 1. 检查是否已登录（有 token 和用户信息）
        if (!appStore.token || !appStore.userInfo) {
            ElMessage.error('请先登录')
            return next('/')
        }

        try {
            // 2. 调用后端验证 token 和角色
            const data = {
                token: appStore.token,
                role: 'admin',
                username: appStore.userInfo.username
            }
            await mainRequest({
                url: '/auth/validate',
                method: 'post',
                data
            })   // 等待验证结果
            // 验证通过，继续导航
            next()
        } catch (error) {
            // 3. 验证失败（token无效、角色不匹配、网络错误等）
            ElMessage.error(error || '权限验证失败，请重新登录')
            // 跳转到首页或登录页
            next(from.path) // 假设首页是公开访问的
        }
    }
    else {
        // 非后台路径，直接放行
        next()
    }
})

export default router