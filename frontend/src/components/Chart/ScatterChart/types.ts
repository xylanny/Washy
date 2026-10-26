import type { ChartLegendPosition } from "../legend";

export type ScatterPointValue = [number, number] | [number, number, number];

export interface ScatterSeriesData {
  name?: string;
  value: ScatterPointValue;
}

export interface ScatterSeries {
  name: string;
  data: ScatterSeriesData[];
  color?: string;
  symbolSize?: number;
  symbol?: string;
  opacity?: number;
}

export interface ScatterChartProps {
  title?: string;
  series: ScatterSeries[];
  xName?: string;
  yName?: string;
  valueUnit?: string;
  showLegend?: boolean;
  /** 图例停靠位置，默认 top */
  legendPosition?: ChartLegendPosition;
  sizeField?: boolean;
  symbolSizeRange?: [number, number];
  dataZoom?: boolean;
  /** 是否显示网格线 */
  showGrid?: boolean;
  height?: string;
}
