<template>
  <div class="chart-page">
    <ChartCanvas :empty="isEmpty">
      <PieChart
        :title="config.title"
        :data="data"
        :show-legend="config.showLegend"
        :value-unit="config.valueUnit"
        :radius="radius"
        :label-position="config.labelPosition"
        :label-type="config.labelType"
        :rose-type="roseType"
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
import PieChart from "@/components/Chart/PieChart/PieChart.vue";
import DataFields from "./fields/DataFields.vue";
import StyleFields from "./fields/StyleFields.vue";
import { useChartPie } from "./useChartPie";
import { useChartStore } from "@/stores/chart";
import { useEditStore } from "@/stores/edit";

const {
  config,
  data,
  isEmpty,
  roseType,
  categoryOptions,
  valueOptions,
  handleFieldUpdate,
  handleTitleUpdate,
  handleReset,
} = useChartPie();

/** 内半径 → ECharts 的 radius（0 表示普通饼图） */
const radius = computed<string | [string, string]>(() => {
  const inner = config.value.innerRadius;

  if (inner <= 0) return "65%";

  // 外半径始终比内半径大一圈
  const outer = Math.min(Math.max(inner + 15, 75), 90);

  return [`${inner}%`, `${outer}%`];
});

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
const chartStore = useChartStore();

// 同一时刻 store 只保留当前页面的图表配置：进入时替换掉上一个页面留下的
chartStore.enterPage("pie");

onMounted(() => editStore.registerReset(handleReset));

onBeforeUnmount(() => {
  editStore.unregisterReset(handleReset);
  chartStore.leavePage("pie");
});
</script>

<style scoped lang="scss" src="./style.scss"></style>
