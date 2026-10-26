import type { CSSProperties } from "vue";
import type { EChartsOption } from "echarts";
import type { Ref } from "vue";
import { computed } from "vue";
import type { ChartTheme, ChartThemeMode } from "@/components/Chart/types";
import { useChartInstance } from "./useChartInstance";
import { resolveTheme } from "@/utils/chartOption";

export interface UseChartShellOptions {
  rootRef: Ref<HTMLElement | undefined>;
  chartRef: Ref<HTMLElement | undefined>;
  getOption: () => EChartsOption;
  getStructureKey: () => string;
  getIsEmpty: () => boolean;
  getThemeMode?: () => ChartThemeMode | undefined;
  getHeight?: () => string | undefined;
  onError?: (error: Error) => void;
}

/**
 * 图表外壳：尺寸、主题、空态、重绘调度
 * 组件负责在 option / isEmpty 变化后调用 schedule()，这里只提供机制
 */
export function useChartShell(options: UseChartShellOptions) {
  const { width, isDark, schedule, resize, getInstance } = useChartInstance({
    rootRef: options.rootRef,
    chartRef: options.chartRef,
    getOption: options.getOption,
    getStructureKey: options.getStructureKey,
    getIsEmpty: options.getIsEmpty,
    onError: options.onError,
  });

  const theme = computed<ChartTheme>(() =>
    resolveTheme(options.getThemeMode?.() ?? "auto", isDark.value),
  );

  const rootStyle = computed<CSSProperties>(() => ({
    height: options.getHeight?.() ?? "100%",
  }));

  return { width, theme, rootStyle, schedule, resize, getInstance };
}
