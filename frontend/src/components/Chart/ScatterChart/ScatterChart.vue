<template>
  <div class="scatter-chart" :style="{ height }">
    <Chart :option="option" type="scatter" @error="onError" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import Chart from "../Chart.vue";
import { buildScatterOption } from "./useScatterOptions";
import type { ScatterChartProps } from "./types";

const props = withDefaults(defineProps<ScatterChartProps>(), {
  title: undefined,
  xName: undefined,
  yName: undefined,
  valueUnit: undefined,
  showLegend: undefined,
  sizeField: false,
  symbolSizeRange: () => [6, 40],
  dataZoom: undefined,
  height: "100%",
});

const emits = defineEmits<{ error: [error: Error] }>();

const option = computed(() => buildScatterOption(props));

function onError(error: Error) {
  emits("error", error);
}
</script>

<style lang="scss" scoped>
.scatter-chart {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
</style>
