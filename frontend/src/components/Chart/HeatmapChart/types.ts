export type HeatmapPoint = [number, number, number];

export interface HeatmapChartProps {
  title?: string;
  xCategories: string[];
  yCategories: string[];
  data: HeatmapPoint[];
  valueUnit?: string;
  colorRange?: string[];
  showVisualMap?: boolean;
  height?: string;
}
