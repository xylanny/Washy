<template>
  <aside
    class="dashboard-sidebar"
    :class="{ 'dashboard-sidebar--open': isOpen }"
  >
    <div
      class="dashboard-sidebar__header"
      :class="{ 'dashboard-sidebar__header--open': isOpen }"
    >
      <div
        class="dashboard-sidebar__icon"
        v-html="ICON_SVG"
        @click="router.push('/')"
      ></div>
      <div
        class="dashboard-sidebar__icon dashboard-sidebar__icon--setting"
        :class="{ 'dashboard-sidebar__icon--setting-open': isOpen }"
        v-html="ICON_SVG_SETTING"
        @click="router.push('/dashboard/setting')"
      ></div>
    </div>

    <nav class="dashboard-sidebar__nav">
      <li
        v-for="{ name, icon, badge } in items"
        :key="name"
        class="dashboard-sidebar__nav-item"
        :class="{
          'dashboard-sidebar__nav-item--active': activeItemName === name,
        }"
        @click="handleActive(name)"
      >
        <a
          href="#"
          class="dashboard-sidebar__nav-link"
          @click.prevent="emits('sidebar-navigate', name)"
        >
          <span class="dashboard-sidebar__nav-icon" v-html="icon"></span>
          <span class="dashboard-sidebar__nav-label" v-if="isOpen">
            {{ name.toUpperCase() }}
          </span>
          <span class="dashboard-sidebar__nav-badge" v-if="isOpen && badge">{{
            badge
          }}</span>
        </a>
      </li>
    </nav>

    <div
      class="dashboard-sidebar__footer"
      :class="{ 'dashboard-sidebar__footer--open': isOpen }"
    >
      <div
        class="dashboard-sidebar__icon dashboard-sidebar__icon--toggle"
        :style="{ transform: isOpen ? 'rotate(180deg)' : 'none' }"
        v-html="ICON_SVG_TOGGLE"
        @click="isOpen = !isOpen"
      ></div>

      <el-avatar
        v-if="isOpen"
        :src="
          userStore.user?.userAvatar
            ? `data:image/jpeg;base64,${userStore.user?.userAvatar}`
            : ''
        "
        :size="32"
        @click="router.push('/profile')"
      ></el-avatar>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { BoardSidebarEmits, BoardSidebarProps } from "./types";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ICON_SVG, ICON_SVG_SETTING, ICON_SVG_TOGGLE } from "./constants";
import { useUserStore } from "@/stores/user";

const isOpen = defineModel<boolean>("is-open", { required: true });
const props = defineProps<BoardSidebarProps>();
const router = useRouter();
const route = useRoute();

const activeItemName = ref<string>(
  typeof route.name === "string" ? route.name : "",
);

const emits = defineEmits<BoardSidebarEmits>();
const userStore = useUserStore();

function handleActive(name: string) {
  activeItemName.value = name;
}
</script>

<style scoped lang="scss" src="./style.scss"></style>
