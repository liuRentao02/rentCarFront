<template>
  <el-container style="height: 100vh">
    <el-header style="padding: 0; height: 60px;">
      <AdminHeader/>
    </el-header>
    <el-container style="height: calc(100vh - 60px);">
      <AdminSidebar/>
      <el-container
          direction="vertical">
        <el-scrollbar height="100%">
          <el-main class="main">
            <router-view/>
          </el-main>
          <el-footer style="height: 40px;">
            <AdminFooter/>
          </el-footer>
        </el-scrollbar>
      </el-container>
    </el-container>
  </el-container>
</template>

<script setup>
import AdminFooter from "@/components/admin/AdminFooter.vue";
import AdminSidebar from "@/components/admin/AdminSidebar.vue";
import AdminHeader from "@/components/admin/AdminHeader.vue";
</script>

<style scoped>
.main {
  background-color: var(--bg-color);
  min-height: calc(100vh - 120px);
}
</style>