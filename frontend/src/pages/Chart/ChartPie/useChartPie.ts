import type {
  PieRoseType,
  PieSeriesData,
} from "@/components/Chart/PieChart/types";
import type { ChartPanelFieldChange } from "../ChartPanel/types";
import type { ChartPieConfig } from "./types";
import { computed, ref, watch } from "vue";
import { toNumber, useChartSource } from "../useChartSource";
import { createDefaultConfig } from "./constants";

/** 饼图页面的状态：数据源、面板配置，以及由二者推导出的图表 props */
export function useChartPie() {
  const { source, rows, valueHeaders, categoryOptions, valueOptions } =
    useChartSource();

  const config = ref<ChartPieConfig>(createDefaultConfig());

  /** 只清理「选过但新数据里不存在」的列，空值保持为空 */
  function syncFields(): void {
    const headers = source.value.headers;

    if (config.value.nameField && !headers.includes(config.value.nameField)) {
      config.value.nameField = "";
    }

    if (
      config.value.valueField &&
      !valueHeaders.value.includes(config.value.valueField)
    ) {
      config.value.valueField = "";
    }
  }

  watch(source, syncFields, { immediate: true });

  /** 名称 + 数值，同名会被 PieChart 自动合并 */
  const data = computed<PieSeriesData[]>(() =>
    rows.value.map((row) => ({
      name: String(row[config.value.nameField] ?? ""),
      value: toNumber(row[config.value.valueField]),
    })),
  );

  /** 必要字段：名称列 + 数值列 */
  const hasRequired = computed(
    () => Boolean(config.value.nameField) && Boolean(config.value.valueField),
  );

  const isEmpty = computed(
    () =>
      !hasRequired.value ||
      !data.value.some((item) => item.value !== null),
  );

  const roseType = computed<PieRoseType | undefined>(() =>
    config.value.rose === "none" ? undefined : config.value.rose,
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
    data,
    isEmpty,
    roseType,
    categoryOptions,
    valueOptions,
    handleFieldUpdate,
    handleTitleUpdate,
    handleReset,
  };
}
