<script setup>
import Header from "@/components/app/Header.vue";
import Footer from "@/components/app/Footer.vue";
import {useRoute} from "vue-router";

const route = useRoute()
</script>

<template>
  <div class="user-app">
    <Header/>
    <RouterView :key="route.fullPath"/>
    <Footer/>
  </div>
</template>

<style scoped>

</style>