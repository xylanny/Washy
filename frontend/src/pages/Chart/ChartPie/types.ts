import type { PieLabelType } from "@/components/Chart/PieChart/types";

/** 饼图标签位置 */
export type ChartPieLabelPosition = "outside" | "inside" | "center";

/** 玫瑰图模式；none 表示普通饼图 */
export type ChartPieRose = "none" | "radius" | "area";

/** 饼图配置 */
export type ChartPieConfig = {
  /** 名称列（取类目列） */
  nameField: string;
  /** 数值列 */
  valueField: string;
  title: string;
  valueUnit: string;
  showLegend: boolean;
  /** 内半径：0 是普通饼图，大于 0 是环形图 */
  innerRadius: number;
  labelPosition: ChartPieLabelPosition;
  labelType: PieLabelType;
  rose: ChartPieRose;
};
