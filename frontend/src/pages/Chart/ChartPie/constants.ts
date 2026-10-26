import type { ChartPanelOption } from "../ChartPanel/types";
import type { ChartPieConfig } from "./types";

/** 标签位置候选 */
export const LABEL_OPTIONS: ChartPanelOption[] = [
  { label: "Outside", value: "outside" },
  { label: "Inside", value: "inside" },
  { label: "Center", value: "center" },
];

/** 标签内容候选 */
export const LABEL_TYPE_OPTIONS: ChartPanelOption[] = [
  { label: "Percent", value: "percent" },
  { label: "Value", value: "value" },
];

/** 玫瑰图模式候选 */
export const ROSE_OPTIONS: ChartPanelOption[] = [
  { label: "None", value: "none" },
  { label: "Radius", value: "radius" },
  { label: "Area", value: "area" },
];

/** 每次 reset 都返回一份全新的配置 */
export function createDefaultConfig(): ChartPieConfig {
  return {
    // 必要字段默认留空：由用户自己选择后才渲染图表
    nameField: "",
    valueField: "",
    title: "",
    valueUnit: "",
    showLegend: true,
    innerRadius: 0,
    labelPosition: "outside",
    labelType: "percent",
    rose: "none",
  };
}
