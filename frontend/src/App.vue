<template>
  <div class="app-washy">
    <div class="main">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useUserStore } from "./stores/user";

const userStore = useUserStore();

onMounted(() => {
  // 恢复登录态：路由守卫也会调用，store 内部会复用同一个请求
  void userStore.ensureSession();
});
</script>

<style lang="scss">
@use "./assets/styles/reset.scss";
</style>
