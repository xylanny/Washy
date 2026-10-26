<template>
  <div class="chart-page">
    <ChartCanvas :empty="isEmpty">
      <LineChart
        :title="config.title"
        :categories="categories"
        :series="series"
        :show-legend="config.showLegend"
        :legend-position="config.legendPosition"
        :value-unit="config.valueUnit"
        :data-zoom="config.dataZoom"
        :smooth="smooth"
        :step="step"
        :area="config.area"
        :area-opacity="config.areaOpacity"
        :line-width="config.lineWidth"
        :line-dash="config.lineDash"
        :symbol="config.symbol"
        :symbol-size="config.symbolSize"
        :show-values="config.showValues"
        :x-label-rotate="config.xLabelRotate"
        :y-scale="config.yScale"
        :show-grid-y="config.showGridY"
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
import ChartCanvas from "../ChartCanvas/ChartCanvas.vue";
import ChartPanel from "../ChartPanel/ChartPanel.vue";
import LineChart from "@/components/Chart/LineChart/LineChart.vue";
import DataFields from "./fields/DataFields.vue";
import LineFields from "./fields/LineFields.vue";
import LegendFields from "./fields/LegendFields.vue";
import AxisFields from "./fields/AxisFields.vue";
import { useChartLine } from "./useChartLine";
import { useChartStore } from "@/stores/chart";
import { useEditStore } from "@/stores/edit";

const {
  config,
  categories,
  series,
  isEmpty,
  categoryOptions,
  valueOptions,
  smooth,
  step,
  handleFieldUpdate,
  handleTitleUpdate,
  handleAddSeries,
  handleRemoveSeries,
  handleUpdateSeries,
  handleReset,
} = useChartLine();

/** 分组：每个分组的表单控件都在自己的组件里 */
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
    name: "line",
    label: "Line",
    component: LineFields,
    props: { model: config.value, empty: isEmpty.value },
  },
  {
    name: "legend",
    label: "Legend",
    component: LegendFields,
    props: { model: config.value },
  },
  {
    name: "axis",
    label: "Axis",
    component: AxisFields,
    props: { model: config.value, empty: isEmpty.value },
  },
]);

const editStore = useEditStore();
const chartStore = useChartStore();

// 同一时刻 store 只保留当前页面的图表配置：进入时替换掉上一个页面留下的
chartStore.enterPage("line");

/** 头部 Edit → Reset 由页面注册，只在图表页生效 */
onMounted(() => editStore.registerReset(handleReset));

onBeforeUnmount(() => {
  editStore.unregisterReset(handleReset);
  chartStore.leavePage("line");
});
</script>

<style scoped lang="scss" src="./style.scss"></style>
