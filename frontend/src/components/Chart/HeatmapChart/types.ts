export type HeatmapPoint = [number, number, number];

export interface HeatmapChartProps {
  title?: string;
  xCategories: string[];
  yCategories: string[];
  data: HeatmapPoint[];
  valueUnit?: string;
  colorRange?: string[];
  showVisualMap?: boolean;
  /** 是否在格子里显示数值；缺省时格子不多才显示 */
  showLabels?: boolean;
  height?: string;
}
