import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import './style.css'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import 'virtual:svg-icons-register'
import {zhCn} from "element-plus/es/locale/index";
import 'element-plus/theme-chalk/dark/css-vars.css'
import './assets/css/user-theme.css'

const app = createApp(App)

// 自动注册全局组件
const commonComponents = import.meta.glob('./components/common/*.vue', { eager: true })
Object.entries(commonComponents).forEach(([path, module]) => {
    const name = path.split('/').pop().replace(/\.\w+$/, '')
    app.component(name, module.default)
})

app.use(router)
app.use(pinia)
app.use(ElementPlus,{
    locale: zhCn
})
app.mount('#app')