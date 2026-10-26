import type { HeatmapPoint } from "@/components/Chart/HeatmapChart/types";
import type { ChartPanelFieldChange } from "../ChartPanel/types";
import type { ChartHeatmapConfig } from "./types";
import { computed, ref, watch } from "vue";
import { toNumber, useChartSource } from "../useChartSource";
import { createDefaultConfig } from "./constants";

/** 热力图页面的状态：行 = 类目，列 = 数值列 */
export function useChartHeatmap() {
  const { source, rows, categoryOptions } = useChartSource();

  const config = ref<ChartHeatmapConfig>(createDefaultConfig());

  function syncFields(): void {
    const { headers } = source.value;

    // 只清理「选过但新数据里不存在」的列，空值保持为空
    if (config.value.xField && !headers.includes(config.value.xField)) {
      config.value.xField = "";
    }
  }

  watch(source, syncFields, { immediate: true });

  const xCategories = computed(() =>
    rows.value.map((row) => String(row[config.value.xField] ?? "")),
  );

  /** y 轴直接用所有数值列 */
  const yCategories = computed(() => source.value.valueHeaders);

  const data = computed<HeatmapPoint[]>(() => {
    const points: HeatmapPoint[] = [];

    rows.value.forEach((row, x) => {
      yCategories.value.forEach((header, y) => {
        const value = toNumber(row[header]);

        if (value !== null) points.push([x, y, value]);
      });
    });

    return points;
  });

  const isEmpty = computed(
    () =>
      !config.value.xField ||
      !yCategories.value.length ||
      !data.value.length,
  );

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
    xCategories,
    yCategories,
    data,
    isEmpty,
    categoryOptions,
    handleFieldUpdate,
    handleTitleUpdate,
    handleReset,
  };
}
