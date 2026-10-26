import type { ChartLegendPosition } from "@/components/Chart/legend";
import type { ChartSeriesItem } from "../types";

/** 柱状图配置 */
export type ChartBarConfig = {
  /** 类目轴字段 */
  categoryField: string;
  title: string;
  valueUnit: string;
  /** 图例开关与停靠位置 */
  showLegend: boolean;
  legendPosition: ChartLegendPosition;
  /** 横向柱状 */
  horizontal: boolean;
  /** 柱宽（px）与圆角（px） */
  barWidth: number;
  borderRadius: number;
  /** 柱子上显示数值 */
  showValues: boolean;
  /** 类目标签旋转角度 */
  xLabelRotate: number;
  /** 数值轴网格线 / 贴合数据 */
  showGridY: boolean;
  yScale: boolean;
  dataZoom: boolean;
  /** 系列列表，一条系列对应一个数值列 */
  series: ChartSeriesItem[];
};
