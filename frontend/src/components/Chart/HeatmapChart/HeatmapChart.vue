<template>
  <div class="heatmap-chart" :style="{ height }">
    <Chart :option="option" type="heatmap" @error="onError" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import Chart from "../Chart.vue";
import { buildHeatmapOption } from "./useHeatmapOptions";
import type { HeatmapChartProps } from "./types";

const props = withDefaults(defineProps<HeatmapChartProps>(), {
  title: undefined,
  valueUnit: undefined,
  colorRange: undefined,
  showVisualMap: true,
  height: "100%",
});

const emits = defineEmits<{ error: [error: Error] }>();

const option = computed(() => buildHeatmapOption(props));

function onError(error: Error) {
  emits("error", error);
}
</script>

<style lang="scss" scoped>
.heatmap-chart {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
</style>
