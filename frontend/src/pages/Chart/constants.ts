import type { TableRow } from "@/types";
import type { ChartPanelOption } from "./ChartPanel/types";
import type { ChartSource } from "./types";

/** 判断某列是否为数值列时最多抽查的行数 */
export const NUMERIC_SAMPLE_ROWS = 500;

/** 系列默认配色，新增系列时依次取用 */
export const SERIES_PALETTE = [
  "#5B8FF9",
  "#5AD8A6",
  "#F6BD16",
  "#E8684A",
  "#9270CA",
  "#6DC8EC",
  "#FF9D4D",
  "#269A99",
];

/** 数据点形状候选 */
export const SYMBOL_OPTIONS: ChartPanelOption[] = [
  { label: "Hollow circle", value: "emptyCircle" },
  { label: "Circle", value: "circle" },
  { label: "Square", value: "rect" },
  { label: "Rounded", value: "roundRect" },
  { label: "Triangle", value: "triangle" },
  { label: "Diamond", value: "diamond" },
  { label: "Pin", value: "pin" },
  { label: "Arrow", value: "arrow" },
  { label: "None", value: "none" },
];

/** 类目标签旋转角度候选 */
export const ROTATE_OPTIONS: ChartPanelOption[] = [
  { label: "Horizontal", value: 0 },
  { label: "45°", value: 45 },
  { label: "90°", value: 90 },
];

/** 没有打开表格时的示例数据，所有图表页共用 */
const DEMO_ROWS: TableRow[] = [
  { month: "Jan", revenue: 4200, target: 4000, cost: 2600 },
  { month: "Feb", revenue: 4680, target: 4400, cost: 2900 },
  { month: "Mar", revenue: 5120, target: 4800, cost: 3100 },
  { month: "Apr", revenue: 4890, target: 5200, cost: 3050 },
  { month: "May", revenue: 5640, target: 5600, cost: 3400 },
  { month: "Jun", revenue: 6120, target: 6000, cost: 3650 },
  { month: "Jul", revenue: 5980, target: 6400, cost: 3580 },
  { month: "Aug", revenue: 6410, target: 6800, cost: 3820 },
  { month: "Sep", revenue: 6890, target: 7200, cost: 4050 },
  { month: "Oct", revenue: 7340, target: 7600, cost: 4280 },
  { month: "Nov", revenue: 7020, target: 8000, cost: 4150 },
  { month: "Dec", revenue: 7680, target: 8400, cost: 4460 },
];

export const DEMO_SOURCE: ChartSource = {
  label: "Sample data",
  headers: ["month", "revenue", "target", "cost"],
  valueHeaders: ["revenue", "target", "cost"],
  rows: DEMO_ROWS,
};
