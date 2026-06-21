import {defineStore} from 'pinia'
import {ref} from "vue";
import {mainRequest} from "@/api/index.js";

export const useAppStore = defineStore('app', () => {
    const token = ref('')
    const userInfo = ref('')
    const role = ref('')

    //sys
    const appConfig = ref('')

    const init = async ()=>{
        appConfig.value = await mainRequest.get("/sys")
    }


    const clearUserData = () => {
        token.value = ''
        userInfo.value = ''
        role.value = ''
    }

    return {
        token,
        userInfo,
        appConfig,
        role,
        clearUserData,
        init
    }
}, {
    persist: true
})