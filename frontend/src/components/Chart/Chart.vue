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
import type { ChartImageSize } from "@/utils/chartExport";
import { useChartStore } from "@/stores/chart";

const props = defineProps<ChartProps>();

const emits = defineEmits<ChartEmits>();

const chartStore = useChartStore();

const chartRef = ref<HTMLElement | null>(null);

let echartInstance: ECharts | null = null;

let resizeObserver: ResizeObserver | null = null;

/** 最后一次发布到 store 的配置，卸载时用它确认该不该清空 */
let snapshot: ChartOption | null = null;

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

    const option = applyLargeDataDefaults(props.option);

    echartInstance.setOption(option, { notMerge: true });

    // 回填给 store：头部 Save 导出时用的就是屏幕上这份配置
    publishChart(option);
  } catch (err) {
    emits("error", err instanceof Error ? err : new Error(String(err)));
  }
}

/** 图表当前的实际尺寸 */
function chartSize(): ChartImageSize {
  return {
    width: echartInstance?.getWidth() ?? 0,
    height: echartInstance?.getHeight() ?? 0,
  };
}

function publishChart(option: ChartOption): void {
  snapshot = option;
  chartStore.publish(option, chartSize());
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
    resizeObserver = new ResizeObserver(() => {
      echartInstance?.resize();

      if (snapshot) chartStore.publishSize(snapshot, chartSize());
    });
    resizeObserver.observe(chartRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;

  // 只清自己发布的那份配置，避免误清新页面的图表
  chartStore.clear(snapshot);
  snapshot = null;

  echartInstance?.dispose();
  echartInstance = null;
});
</script>

<style lang="scss" scoped src="./style.scss"></style>
