import type { ScatterSeries } from "@/components/Chart/ScatterChart/types";
import type { ChartPanelFieldChange } from "../ChartPanel/types";
import type { ChartScatterConfig } from "./types";
import { computed, ref, watch } from "vue";
import { SERIES_PALETTE } from "../constants";
import { toNumber, useChartSource } from "../useChartSource";
import { createDefaultConfig } from "./constants";

/** 一对有限数值才算一个点 */
type ScatterPoint = [number, number];

/** 散点图页面的状态：数据源、面板配置，以及由二者推导出的图表 props */
export function useChartScatter() {
  const { source, rows, valueHeaders, valueOptions } = useChartSource();

  const config = ref<ChartScatterConfig>(createDefaultConfig());

  /** 只清理「选过但新数据里不存在」的列，空值保持为空 */
  function syncFields(): void {
    const available = valueHeaders.value;

    if (config.value.xField && !available.includes(config.value.xField)) {
      config.value.xField = "";
    }

    if (config.value.yField && !available.includes(config.value.yField)) {
      config.value.yField = "";
    }
  }

  watch(source, syncFields, { immediate: true });

  const points = computed<ScatterPoint[]>(() =>
    rows.value
      .map((row) => {
        const x = toNumber(row[config.value.xField]);
        const y = toNumber(row[config.value.yField]);

        return x === null || y === null ? null : ([x, y] as ScatterPoint);
      })
      .filter((point): point is ScatterPoint => point !== null),
  );

  const series = computed<ScatterSeries[]>(() => [
    {
      name: config.value.yField || "Points",
      data: points.value.map((value) => ({ value })),
      color: SERIES_PALETTE[0],
      symbol: config.value.symbol,
      symbolSize: config.value.symbolSize,
      opacity: config.value.opacity / 100,
    },
  ]);

  /** 必要字段：两个不同的数值列 */
  const hasRequired = computed(
    () =>
      Boolean(config.value.xField) &&
      Boolean(config.value.yField) &&
      config.value.xField !== config.value.yField,
  );

  const isEmpty = computed(() => !hasRequired.value || !points.value.length);

  function handleFieldUpdate({ key, value }: ChartPanelFieldChange): void {
    if (!(key in config.value)) return;

    Object.assign(config.value, { [key]: value });
  }

  function handleTitleUpdate(value: string): void {
    config.value.title = value;
  }

  function handleReset(): void {
    config.value = createDefaultConfig();
    syncFields();
  }

  return {
    config,
    series,
    isEmpty,
    valueOptions,
    xName: computed(() => config.value.xField),
    yName: computed(() => config.value.yField),
    handleFieldUpdate,
    handleTitleUpdate,
    handleReset,
  };
}
