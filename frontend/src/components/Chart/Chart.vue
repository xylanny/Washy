<template>
  <div ref="chartRef" class="chart"></div>
</template>

<script lang="ts" setup>
import * as echarts from "echarts";
import type { ECharts } from "echarts";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { isArray } from "@/utils/judge";
import {
  LARGE_SUPPORTED_TYPES,
  NON_CARTESIAN_TYPES,
  RENDER_POINTS_MAX,
} from "./constants";
import type { ChartEmits, ChartOption, ChartProps } from "./types";

const props = defineProps<ChartProps>();

const emits = defineEmits<ChartEmits>();

const chartRef = ref<HTMLElement | null>(null);

let echartInstance: ECharts | null = null;

let resizeObserver: ResizeObserver | null = null;

function countPointNum(option: ChartOption): number {
  const series = option.series;

  if (!series) return 0;

  const list = isArray(series) ? series : [series];

  return list.reduce((total, cur) => {
    const data = (cur as { data?: unknown }).data;

    return total + (isArray(data) ? data.length : 0);
  }, 0);
}

function applyLargeDataDefaults(option: ChartOption): ChartOption {
  const isRadial = props.type
    ? NON_CARTESIAN_TYPES.includes(props.type)
    : false;

  const isLarge = countPointNum(option) > RENDER_POINTS_MAX;

  const series = option.series;
  const list = series ? (isArray(series) ? series : [series]) : [];
  const patchedSeries = list.map((cur) => {
    const item = cur as Record<string, unknown>;
    const type = item.type as string;

    if (!isLarge || isRadial || !LARGE_SUPPORTED_TYPES.includes(type)) {
      return cur;
    }

    if (item.large !== undefined) return cur;

    return {
      ...item,
      large: true,
      largeThreshold: RENDER_POINTS_MAX,
    };
  });

  const patchedSeriesValue = isArray(series)
    ? patchedSeries
    : (patchedSeries[0] ?? series);

  return {
    animation: !isLarge,
    tooltip: {
      trigger: isRadial ? "item" : "axis",
    },
    dataZoom:
      !isRadial && isLarge
        ? [
            { type: "inside", start: 0, end: 100 },
            { type: "slider", height: 16, bottom: 8 },
          ]
        : undefined,
    ...option,
    series: patchedSeriesValue,
  } as ChartOption;
}

function renderChart() {
  if (!chartRef.value) return;

  try {
    if (!echartInstance) {
      echartInstance = echarts.init(chartRef.value);
    }

    echartInstance.setOption(applyLargeDataDefaults(props.option), {
      notMerge: true,
    });
  } catch (err) {
    emits("error", err instanceof Error ? err : new Error(String(err)));
  }
}

watch(() => props.option, renderChart, { deep: true });

watch(() => props.type, renderChart);

/** 暴露给父组件，容器尺寸变化时可手动调用 */
function resize() {
  echartInstance?.resize();
}

defineExpose({ resize });

onMounted(async () => {
  await nextTick();
  renderChart();

  if (chartRef.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => echartInstance?.resize());
    resizeObserver.observe(chartRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;

  echartInstance?.dispose();
  echartInstance = null;
});
</script>

<style lang="scss" scoped src="./style.scss"></style>
