<template>
  <div class="chart-page">
    <ChartCanvas :empty="isEmpty">
      <ScatterChart
        :title="config.title"
        :series="series"
        :x-name="xName"
        :y-name="yName"
        :show-legend="config.showLegend"
        :legend-position="config.legendPosition"
        :value-unit="config.valueUnit"
        :data-zoom="config.dataZoom"
        :show-grid="config.showGrid"
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
import ScatterChart from "@/components/Chart/ScatterChart/ScatterChart.vue";
import DataFields from "./fields/DataFields.vue";
import StyleFields from "./fields/StyleFields.vue";
import { useChartScatter } from "./useChartScatter";
import { useEditStore } from "@/stores/edit";

const {
  config,
  series,
  isEmpty,
  valueOptions,
  xName,
  yName,
  handleFieldUpdate,
  handleTitleUpdate,
  handleReset,
} = useChartScatter();

const tabs = computed<ChartPanelTab[]>(() => [
  {
    name: "data",
    label: "Data",
    component: DataFields,
    props: { model: config.value, valueOptions: valueOptions.value },
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
