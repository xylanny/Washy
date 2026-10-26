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
  sizeField?: boolean;
  symbolSizeRange?: [number, number];
  dataZoom?: boolean;
  height?: string;
}
