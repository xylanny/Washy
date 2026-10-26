<template>
  <div class="bar-chart" :style="{ height }">
    <Chart :option="option" type="bar" @error="onError" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import Chart from "../Chart.vue";
import { buildBarOption } from "./useBarOptions";
import type { BarChartProps } from "./types";

const props = withDefaults(defineProps<BarChartProps>(), {
  title: undefined,
  showLegend: undefined,
  valueUnit: undefined,
  dataZoom: undefined,
  height: "100%",
});

const emits = defineEmits<{ error: [error: Error] }>();

const option = computed(() => buildBarOption(props));

function onError(error: Error) {
  emits("error", error);
}
</script>

<style lang="scss" scoped>
.bar-chart {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
</style>
