import type { ChartLegendPosition } from "../legend";

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

/** 图例停靠位置 */
export type LineLegendPosition = ChartLegendPosition;

/** 阶梯折线的转折方向 */
export type LineStep = "start" | "middle" | "end";

/** 线型 */
export type LineDash = "solid" | "dashed" | "dotted";

export interface LineChartProps {
  title?: string;
  categories: (string | number)[];
  series: LineSeries[];
  showLegend?: boolean;
  /** 图例停靠位置，默认 top */
  legendPosition?: LineLegendPosition;
  valueUnit?: string;
  dataZoom?: boolean;
  /** 以下为所有系列共用的折线样式 */
  smooth?: boolean;
  /** 阶梯折线；设置后 smooth 不再生效 */
  step?: LineStep;
  area?: boolean;
  /** 面积填充的不透明度（0–100） */
  areaOpacity?: number;
  lineWidth?: number;
  lineDash?: LineDash;
  /** ECharts symbol 名称，none 表示不画数据点 */
  symbol?: string;
  symbolSize?: number;
  /** 在数据点上显示数值 */
  showValues?: boolean;
  /** 类目标签的旋转角度（0 / 45 / 90） */
  xLabelRotate?: number;
  /** 纵轴贴合数据范围（不再强制从 0 开始） */
  yScale?: boolean;
  /** 是否显示水平网格线 */
  showGridY?: boolean;
  height?: string;
}
