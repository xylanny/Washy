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
  valueUnit?: string;
  dataZoom?: boolean;
  height?: string;
}
