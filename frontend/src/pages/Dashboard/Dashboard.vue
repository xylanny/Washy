<template>
  <div class="dashboard" :class="{ 'dashboard--open': isOpen }">
    <DashboardSidebar
      v-model:is-open="isOpen"
      :items="ITEMS"
      @sidebar-navigate="handleSidebarNavigate"
    />

    <DashboardHeader />

    <main class="dashboard__main">
      <div class="dashboard__content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import DashboardSidebar from "./DashboardSidebar/DashboardSidebar.vue";
import DashboardHeader from "./DashboardHeader/DashboardHeader.vue";
import { ITEMS } from "./constants.ts";

const isOpen = ref(false);
const router = useRouter();

function handleSidebarNavigate(name: string) {
  router.replace({ name });
}
</script>

<style scoped lang="scss">
.dashboard {
  height: 100vh;
  width: 100%;
  display: grid;
  grid-template-columns: 54px 1fr;
  grid-template-rows: 48px 1fr;
  grid-template-areas:
    "sidebar header"
    "sidebar content";
  transition: $transition;
  overflow: hidden;
}

.dashboard--open {
  grid-template-columns: 200px 1fr;
}

.dashboard__main {
  grid-area: content;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dashboard__content {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}
</style>
