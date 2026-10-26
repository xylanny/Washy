export interface LineSeriesData {
  name: string | number;
  value: number | null;
}

export interface LineSeries {
  name: string;
  data: LineSeriesData[];
  smooth?: boolean;
  area?: boolean;
  color?: string;
  stack?: string;
}

export interface LineChartProps {
  title?: string;
  categories: (string | number)[];
  series: LineSeries[];
  showLegend?: boolean;
  valueUnit?: string;
  dataZoom?: boolean;
  height?: string;
}
