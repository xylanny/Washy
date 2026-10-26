<template>
  <section class="setting">
    <header class="setting__heading">
      <h1 class="setting__title">Settings</h1>
    </header>

    <div class="setting__body">
      <!-- 左侧分类，右侧显示该分类的设置项（与 Typora 设置面板结构一致） -->
      <nav class="setting__nav" aria-label="Settings sections">
        <button
          v-for="section in SECTIONS"
          :key="section.name"
          type="button"
          class="setting__nav-item"
          :class="{ 'is-active': section.name === activeSection }"
          :aria-current="section.name === activeSection ? 'page' : undefined"
          @click="activeSection = section.name"
        >
          {{ section.label }}
        </button>
      </nav>

      <main class="setting__panel">
        <section v-if="activeSection === 'appearance'" class="setting__section">
          <h2 class="setting__section-title">Appearance</h2>
          <p class="setting__section-desc">How Washy looks on this device.</p>

          <div class="setting__row">
            <div class="setting__row-main">
              <span class="setting__row-label">Theme</span>
              <span class="setting__row-hint">
                Light, dark, or follow the system setting.
              </span>
            </div>

            <div class="setting__row-control">
              <FormSelect
                :model-value="themeMode"
                :options="THEME_OPTIONS"
                @update:model-value="setTheme"
              />
            </div>
          </div>
        </section>

        <section v-else-if="activeSection === 'charts'" class="setting__section">
          <h2 class="setting__section-title">Charts</h2>
          <p class="setting__section-desc">
            Defaults applied to every chart preview.
          </p>

          <div class="setting__row">
            <div class="setting__row-main">
              <span class="setting__row-label">Preview points</span>
              <span class="setting__row-hint">
                Rows loaded into a chart — larger values are slower but show
                more detail.
              </span>
            </div>

            <div class="setting__row-control">
              <FormSelect
                :model-value="chartPoints"
                :options="POINT_OPTIONS"
                @update:model-value="setChartPoints"
              />
            </div>
          </div>
        </section>

        <section v-else class="setting__section">
          <h2 class="setting__section-title">Table</h2>
          <p class="setting__section-desc">How the data grid is rendered.</p>

          <div class="setting__row">
            <div class="setting__row-main">
              <span class="setting__row-label">Compact rows</span>
              <span class="setting__row-hint">
                Show more rows at once in the table view.
              </span>
            </div>

            <div class="setting__row-control">
              <FormSwitch
                :model-value="compactTable"
                @update:model-value="setCompactTable"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ThemeMode } from "@/stores/system";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import FormSelect from "@/components/Form/FormSelect/FormSelect.vue";
import FormSwitch from "@/components/Form/FormSwitch/FormSwitch.vue";
import { POINT_OPTIONS, SECTIONS, THEME_OPTIONS } from "./constants";
import { useSystemStore } from "@/stores/system";

const systemStore = useSystemStore();
const { themeMode, chartPoints, compactTable } = storeToRefs(systemStore);

const activeSection = ref(SECTIONS[0].name);

function setTheme(value: string | number | undefined): void {
  if (value === undefined || value === "") return;

  themeMode.value = String(value) as ThemeMode;
}

function setChartPoints(value: string | number | undefined): void {
  const points = Number(value);

  if (!Number.isFinite(points) || points <= 0) return;

  chartPoints.value = points;
}

function setCompactTable(value: boolean | undefined): void {
  compactTable.value = Boolean(value);
}
</script>

<style scoped lang="scss" src="./style.scss"></style>
