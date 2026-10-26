import type { ChartLegendPosition } from "@/components/Chart/legend";

/** 散点图配置：两个数值列分别作为 x / y */
export type ChartScatterConfig = {
  xField: string;
  yField: string;
  title: string;
  valueUnit: string;
  showLegend: boolean;
  legendPosition: ChartLegendPosition;
  symbol: string;
  symbolSize: number;
  /** 点的不透明度（0–100） */
  opacity: number;
  /** 是否显示网格线 */
  showGrid: boolean;
  dataZoom: boolean;
};
