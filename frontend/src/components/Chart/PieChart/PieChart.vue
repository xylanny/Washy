<template>
  <div class="pie-chart" :style="{ height }">
    <Chart :option="option" type="pie" @error="onError" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import Chart from "../Chart.vue";
import { buildPieOption } from "./usePieOptions";
import type { PieChartProps } from "./types";

const props = withDefaults(defineProps<PieChartProps>(), {
  title: undefined,
  showLegend: undefined,
  valueUnit: undefined,
  radius: undefined,
  donut: false,
  labelPosition: "outside",
  roseType: undefined,
  height: "100%",
});

const emits = defineEmits<{ error: [error: Error] }>();

const option = computed(() => buildPieOption(props));

function onError(error: Error) {
  emits("error", error);
}
</script>

<style lang="scss" scoped>
.pie-chart {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
</style>
