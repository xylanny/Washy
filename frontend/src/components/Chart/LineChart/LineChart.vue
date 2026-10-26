<template>
  <div class="line-chart" :style="{ height }">
    <Chart :option="option" type="line" @error="onError" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import Chart from "../Chart.vue";
import { buildLineOption } from "./useLineOptions";
import type { LineChartProps } from "./types";

const props = withDefaults(defineProps<LineChartProps>(), {
  title: undefined,
  showLegend: undefined,
  valueUnit: undefined,
  dataZoom: undefined,
  height: "100%",
});

const emits = defineEmits<{ error: [error: Error] }>();

const option = computed(() => buildLineOption(props));

function onError(error: Error) {
  emits("error", error);
}
</script>

<style lang="scss" scoped>
.line-chart {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
</style>
