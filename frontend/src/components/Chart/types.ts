import type { EChartsOption } from "echarts";

export type ChartOption = EChartsOption;

/** 图表主题模式：auto 跟随全局明暗，light / dark 强制指定 */
export type ChartThemeMode = "auto" | "light" | "dark";

/** 图表主题：ECharts 里与配色相关的部分 */
export interface ChartTheme {
  isDark: boolean;
  /** 主文字色（标题、图例） */
  textColor: string;
  /** 次要文字色（坐标轴标签） */
  subTextColor: string;
  /** 坐标轴线与刻度线 */
  axisLineColor: string;
  /** 网格分割线 */
  splitLineColor: string;
  /** 提示框背景 */
  tooltipBackgroundColor: string;
  /** 提示框文字 */
  tooltipTextColor: string;
}

export interface ChartProps {
  option: ChartOption;
  type?: string;
}

export interface ChartEmits {
  error: [error: Error];
}
