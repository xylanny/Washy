import type { ChartSeriesItem } from "../../types";
import type { ChartPanelOption } from "../types";

export interface ChartSeriesListProps {
  series: ChartSeriesItem[];
  /** 数值列候选 */
  options: ChartPanelOption[];
  /** 还有可用数值列时才显示新增按钮 */
  addable?: boolean;
}

export interface ChartSeriesListEmits {
  /** 行内字段变更：index + 字段名 + 新值 */
  update: [index: number, key: string, value: string];
  add: [];
  remove: [index: number];
}
