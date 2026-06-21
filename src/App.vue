<template>
  <RouterView/>
</template>

<script setup>
import {useAppStore} from "@/stores/app.js";
import {onMounted} from "vue";

const appStore = useAppStore();
onMounted(()=>{
  appStore.init()
})
</script>

<style scoped>
</style>