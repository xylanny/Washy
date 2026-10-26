import type { BarSeries } from "@/components/Chart/BarChart/types";
import type {
  ChartPanelFieldChange,
  ChartPanelItemChange,
} from "../ChartPanel/types";
import type { ChartBarConfig } from "./types";
import { computed, ref, watch } from "vue";
import { SERIES_PALETTE } from "../constants";
import { toNumber, useChartSource } from "../useChartSource";
import { createDefaultConfig } from "./constants";

/** 柱状图页面的状态：数据源、面板配置，以及由二者推导出的图表 props */
export function useChartBar() {
  const { source, rows, valueHeaders, categoryOptions, valueOptions } =
    useChartSource();

  const config = ref<ChartBarConfig>(createDefaultConfig());

  /** 只清理「选过但新数据里不存在」的列，空值保持为空 */
  function syncSeriesFields(): void {
    const available = valueHeaders.value;
    const taken = new Set<string>();

    config.value.series = config.value.series.map((item) => {
      if (!item.field) return item;

      if (!available.includes(item.field) || taken.has(item.field)) {
        return { ...item, field: "" };
      }

      taken.add(item.field);

      return item;
    });
  }

  function syncFields(): void {
    const { headers } = source.value;

    if (
      config.value.categoryField &&
      !headers.includes(config.value.categoryField)
    ) {
      config.value.categoryField = "";
    }

    syncSeriesFields();
  }

  watch(source, syncFields, { immediate: true });

  const categories = computed(() =>
    rows.value.map((row) => String(row[config.value.categoryField] ?? "")),
  );

  const series = computed<BarSeries[]>(() =>
    config.value.series
      .filter((item) => item.field)
      .map((item) => ({
        name: item.field,
        data: rows.value.map((row, index) => ({
          name: categories.value[index],
          value: toNumber(row[item.field]),
        })),
        color: item.color,
        horizontal: config.value.horizontal,
        barWidth: config.value.barWidth,
        borderRadius: config.value.borderRadius,
      })),
  );

  /** 必要字段：类目列 + 至少一条选好列的系列 */
  const hasRequired = computed(
    () =>
      Boolean(config.value.categoryField) &&
      config.value.series.some((item) => item.field),
  );

  const hasValues = computed(() =>
    config.value.series.some(
      (item) =>
        item.field &&
        rows.value.some((row) => toNumber(row[item.field]) !== null),
    ),
  );

  const isEmpty = computed(
    () => !hasRequired.value || !categories.value.length || !hasValues.value,
  );

  function handleFieldUpdate({ key, value }: ChartPanelFieldChange): void {
    if (!(key in config.value)) return;

    Object.assign(config.value, { [key]: value });
  }

  function handleTitleUpdate(value: string): void {
    config.value.title = value;
  }

  /** + ：补一条空白系列（数值列交给用户自己选），颜色取下一个没用的 */
  function handleAddSeries(): void {
    const usedColors = new Set(
      config.value.series.map((item) => item.color.toLowerCase()),
    );

    const color =
      SERIES_PALETTE.find((item) => !usedColors.has(item.toLowerCase())) ??
      SERIES_PALETTE[config.value.series.length % SERIES_PALETTE.length];

    config.value.series = [...config.value.series, { field: "", color }];
  }

  function handleRemoveSeries(index: number): void {
    config.value.series = config.value.series.filter((_, i) => i !== index);
  }

  function handleUpdateSeries({
    index,
    key,
    value,
  }: ChartPanelItemChange): void {
    const item = config.value.series[index];

    if (!item || !(key in item)) return;

    Object.assign(item, { [key]: value });
  }

  function handleReset(): void {
    config.value = createDefaultConfig();
    syncFields();
  }

  return {
    config,
    categories,
    series,
    isEmpty,
    categoryOptions,
    valueOptions,
    handleFieldUpdate,
    handleTitleUpdate,
    handleAddSeries,
    handleRemoveSeries,
    handleUpdateSeries,
    handleReset,
  };
}
