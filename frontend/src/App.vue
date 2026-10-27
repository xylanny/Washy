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
  userStore.resume();
});
</script>

<style lang="scss">
@use "./assets/styles/reset.scss";
</style>
