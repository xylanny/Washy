export interface PieSeriesData {
  name: string;
  value: number | null;
}

export type PieRoseType = "radius" | "area";

export interface PieChartProps {
  title?: string;
  data: PieSeriesData[];
  showLegend?: boolean;
  valueUnit?: string;
  radius?: string | [string, string];
  donut?: boolean;
  labelPosition?: "outside" | "inside" | "center";
  roseType?: PieRoseType;
  height?: string;
}
