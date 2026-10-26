import type { TableRow } from "@/types";

/** 图表页的数据源：已打开的表格，或内置示例数据 */
export interface ChartSource {
  /** 数据源名称 */
  label: string;
  headers: string[];
  /** 可作为数值序列的列 */
  valueHeaders: string[];
  rows: TableRow[];
}

/** 系列行：一个数值列 + 颜色（折线 / 柱状等共用） */
export interface ChartSeriesItem {
  field: string;
  color: string;
}
