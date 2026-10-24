<template>
  <div class="setting">
    <header class="setting__heading">
      <h1 class="setting__title">Settings</h1>
    </header>

    <main class="setting__main">
      <section class="setting__panel">
        <div class="setting__row">
          <span class="setting__label">Theme:</span>
          <div class="setting__select">
            <button
              type="button"
              class="setting__select-trigger"
              @click="isThemeMenuOpen = !isThemeMenuOpen"
            >
              {{ curTheme }}
            </button>

            <div class="setting__menu" v-if="isThemeMenuOpen">
              <button
                v-for="(value, key) in THEMES"
                :key="key"
                type="button"
                class="setting__menu-option"
                :class="{
                  'setting__menu-option--selected': themeMode === value,
                }"
                @click="selectTheme(value)"
              >
                {{ value }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="setting__footer">
      <span class="setting__footer-text">SETTINGS — MAKE IT YOURS</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useSystemStore } from "@/stores/system";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { THEMES, type ThemeMode } from "./types";

const systemStore = useSystemStore();
const { themeMode } = storeToRefs(systemStore);
const isThemeMenuOpen = ref(false);

const curTheme = computed(() =>
  Object.keys(THEMES).find((k) => k === themeMode.value),
);

function selectTheme(value: ThemeMode) {
  themeMode.value = value;
  isThemeMenuOpen.value = false;
}
</script>

<style scoped lang="scss" src="./style.scss"></style>
