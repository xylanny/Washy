<template>
  <div class="chart-page">
    <ChartCanvas :empty="isEmpty">
      <BarChart
        :title="config.title"
        :categories="categories"
        :series="series"
        :show-legend="config.showLegend"
        :legend-position="config.legendPosition"
        :value-unit="config.valueUnit"
        :data-zoom="config.dataZoom"
        :show-values="config.showValues"
        :x-label-rotate="config.xLabelRotate"
        :show-grid-y="config.showGridY"
        :y-scale="config.yScale"
      />
    </ChartCanvas>

    <ChartPanel
      :model="config"
      :tabs="tabs"
      :title="config.title"
      @update:title="handleTitleUpdate"
      @update:field="handleFieldUpdate"
      @update:item="handleUpdateSeries"
      @add:item="handleAddSeries"
      @remove:item="handleRemoveSeries"
    />
  </div>
</template>

<script setup lang="ts">
import type { ChartPanelTab } from "../ChartPanel/types";
import { computed, onBeforeUnmount, onMounted } from "vue";
import BarChart from "@/components/Chart/BarChart/BarChart.vue";
import ChartCanvas from "../ChartCanvas/ChartCanvas.vue";
import ChartPanel from "../ChartPanel/ChartPanel.vue";
import DataFields from "./fields/DataFields.vue";
import StyleFields from "./fields/StyleFields.vue";
import { useChartBar } from "./useChartBar";
import { useEditStore } from "@/stores/edit";

const {
  config,
  categories,
  series,
  isEmpty,
  categoryOptions,
  valueOptions,
  handleFieldUpdate,
  handleTitleUpdate,
  handleAddSeries,
  handleRemoveSeries,
  handleUpdateSeries,
  handleReset,
} = useChartBar();

const tabs = computed<ChartPanelTab[]>(() => [
  {
    name: "data",
    label: "Data",
    component: DataFields,
    props: {
      model: config.value,
      categoryOptions: categoryOptions.value,
      valueOptions: valueOptions.value,
    },
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
