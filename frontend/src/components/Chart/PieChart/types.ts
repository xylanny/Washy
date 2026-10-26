export interface PieSeriesData {
  name: string;
  value: number | null;
}

export type PieRoseType = "radius" | "area";

/** 标签内容：百分比或数值 */
export type PieLabelType = "percent" | "value";

export interface PieChartProps {
  title?: string;
  data: PieSeriesData[];
  showLegend?: boolean;
  valueUnit?: string;
  radius?: string | [string, string];
  donut?: boolean;
  labelPosition?: "outside" | "inside" | "center";
  labelType?: PieLabelType;
  roseType?: PieRoseType;
  height?: string;
}
