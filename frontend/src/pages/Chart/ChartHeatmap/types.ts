/** 热力图配色方案 */
export type ChartHeatmapPalette = "spectrum" | "sea" | "warm";

/** 热力图配置：类目列作 x，所有数值列作 y */
export type ChartHeatmapConfig = {
  /** 类目轴字段 */
  xField: string;
  title: string;
  valueUnit: string;
  /** 是否显示颜色刻度条 */
  showVisualMap: boolean;
  /** 是否在格子里显示数值 */
  showLabels: boolean;
  /** 配色方案 */
  palette: ChartHeatmapPalette;
};
