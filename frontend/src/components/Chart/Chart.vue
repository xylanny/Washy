<template>
  <div ref="chartRef" class="chart"></div>
</template>

<script lang="ts" setup>
import type { ECharts } from "echarts";
import type { ChartEmits, ChartOption, ChartProps } from "./types";
import { nextTick, onBeforeMount, onMounted, ref, watch } from "vue";
import { isArray } from "@/utils/judge";
import { NON_CARTESIAN_TYPES, RENDER_POINTS_MAX } from "./constants";
import * as echarts from "echarts";

const props = defineProps<ChartProps>();

const emits = defineEmits<ChartEmits>();

const chartRef = ref<HTMLElement | null>(null);

let echartInstance: ECharts | null = null;

/**
 * 统计options中的总数据点数量
 *
 */
function countPointNum(option: ChartOption): number {
  const series = option.series;

  if (!series) return 0;

  const arr = isArray(series) ? series : [series];

  let total = 0;

  for (const cur of arr) {
    const data = (cur as { data?: unknown }).data;

    if (isArray(data)) {
      total += data.length;
    }
  }

  return total;
}

function buildFinalOption(option: ChartOption): ChartOption {
  const isRadial = props.type
    ? NON_CARTESIAN_TYPES.includes(props.type)
    : false;

  const pointNum = countPointNum(option);
  const isLarge = pointNum > RENDER_POINTS_MAX;

  return {
    animation: !isLarge,
    tooltip: {
      trigger: isRadial ? "item" : "axis",
    },
    dataZoom:
      !isRadial && isLarge
        ? [
            {
              type: "inside",
              start: 0,
              end: 100,
            },
            {
              type: "slider",
              height: 16,
              bottom: 8,
            },
          ]
        : undefined,

    ...option,
  };
}

function renderChart() {
  if (!chartRef.value) return;

  try {
    if (!echartInstance) {
      echartInstance = echarts.init(chartRef.value);
    }

    echartInstance.setOption(buildFinalOption(props.option), {
      notMerge: true,
    });

    echartInstance.setOption(buildFinalOption(props.option));
  } catch (err) {
    emits("error", err as Error);
  }
}

watch(() => props.option, renderChart, { deep: true });
watch(() => props.type, renderChart);

let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  await nextTick();

  renderChart();

  if (chartRef.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => echartInstance?.resize());
    resizeObserver.observe(chartRef.value);
  }
});

onBeforeMount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;

  echartInstance?.dispose();
  echartInstance = null;
});
</script>

<style lang="scss" scoped src="./style.scss"></style>
