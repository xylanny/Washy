<template>
  <div class="chart-page">
    <ChartCanvas :empty="isEmpty">
      <HeatmapChart
        :title="config.title"
        :x-categories="xCategories"
        :y-categories="yCategories"
        :data="data"
        :value-unit="config.valueUnit"
        :color-range="colorRange"
        :show-visual-map="config.showVisualMap"
        :show-labels="config.showLabels"
      />
    </ChartCanvas>

    <ChartPanel
      :model="config"
      :tabs="tabs"
      :title="config.title"
      @update:title="handleTitleUpdate"
      @update:field="handleFieldUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import type { ChartPanelTab } from "../ChartPanel/types";
import { computed, onBeforeUnmount, onMounted } from "vue";
import ChartCanvas from "../ChartCanvas/ChartCanvas.vue";
import ChartPanel from "../ChartPanel/ChartPanel.vue";
import HeatmapChart from "@/components/Chart/HeatmapChart/HeatmapChart.vue";
import { PALETTES } from "./constants";
import DataFields from "./fields/DataFields.vue";
import StyleFields from "./fields/StyleFields.vue";
import { useChartHeatmap } from "./useChartHeatmap";
import { useEditStore } from "@/stores/edit";

const {
  config,
  xCategories,
  yCategories,
  data,
  isEmpty,
  categoryOptions,
  handleFieldUpdate,
  handleTitleUpdate,
  handleReset,
} = useChartHeatmap();

/** 配色方案 → ECharts 的色带 */
const colorRange = computed(() => PALETTES[config.value.palette]);

const tabs = computed<ChartPanelTab[]>(() => [
  {
    name: "data",
    label: "Data",
    component: DataFields,
    props: { model: config.value, categoryOptions: categoryOptions.value },
  },
  {
    name: "style",
    label: "Style",
    component: StyleFields,
    props: { model: config.value, empty: isEmpty.value },
  },
]);

const editStore = useEditStore();

onMounted(() => editStore.registerReset(handleReset));

onBeforeUnmount(() => editStore.unregisterReset(handleReset));
</script>

<style scoped lang="scss" src="./style.scss"></style>
