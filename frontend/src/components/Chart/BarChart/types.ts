import type { ChartLegendPosition } from "../legend";

export interface BarSeriesData {
  name: string | number;
  value: number | null;
}

export interface BarSeries {
  name: string;
  data: BarSeriesData[];
  horizontal?: boolean;
  color?: string;
  stack?: string;
  barWidth?: string | number;
  borderRadius?: number | [number, number, number, number];
}

export interface BarChartProps {
  title?: string;
  categories: (string | number)[];
  series: BarSeries[];
  showLegend?: boolean;
  /** 图例停靠位置，默认 top */
  legendPosition?: ChartLegendPosition;
  valueUnit?: string;
  dataZoom?: boolean;
  /** 在柱子上显示数值 */
  showValues?: boolean;
  /** 类目标签的旋转角度（0 / 45 / 90） */
  xLabelRotate?: number;
  /** 数值轴网格线 */
  showGridY?: boolean;
  /** 数值轴贴合数据范围 */
  yScale?: boolean;
  height?: string;
}
