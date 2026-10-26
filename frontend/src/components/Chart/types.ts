import type { EChartsOption } from "echarts";

export type ChartOption = EChartsOption;

export interface ChartProps {
  option: ChartOption;
  type?: string;
}

export interface ChartEmits {
  error: [error: Error];
}
