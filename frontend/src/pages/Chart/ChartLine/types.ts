import type {
  LineDash,
  LineLegendPosition,
} from "@/components/Chart/LineChart/types";
import type { ChartSeriesItem } from "../types";

/** 折线形态：直线 / 平滑 / 三种阶梯 */
export type ChartLineShape =
  | "straight"
  | "smooth"
  | "step-start"
  | "step-middle"
  | "step-end";

/**
 * 折线图配置
 *
 * 用类型别名（而不是 interface）声明，面板里按 key 读写这个对象。
 */
export type ChartLineConfig = {
  /** 类目轴字段 */
  categoryField: string;
  title: string;
  valueUnit: string;
  /** 图例开关与停靠位置 */
  showLegend: boolean;
  legendPosition: LineLegendPosition;
  /** 折线形态（含阶梯） */
  shape: ChartLineShape;
  area: boolean;
  /** 面积填充不透明度（0–100） */
  areaOpacity: number;
  lineWidth: number;
  lineDash: LineDash;
  /** 数据点形状与大小 */
  symbol: string;
  symbolSize: number;
  /** 数据点上显示数值 */
  showValues: boolean;
  /** 类目标签旋转角度 */
  xLabelRotate: number;
  /** 纵轴贴合数据、水平网格线 */
  yScale: boolean;
  showGridY: boolean;
  dataZoom: boolean;
  /** 系列列表，一条系列对应一个数值列 */
  series: ChartSeriesItem[];
};
