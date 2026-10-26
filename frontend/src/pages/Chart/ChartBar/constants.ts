import type { ChartPanelOption } from "../ChartPanel/types";
import type { ChartBarConfig } from "./types";
import { SERIES_PALETTE } from "../constants";

/** 柱状方向候选 */
export const ORIENTATION_OPTIONS: ChartPanelOption[] = [
  { label: "Vertical", value: "vertical" },
  { label: "Horizontal", value: "horizontal" },
];

/** 每次 reset 都返回一份全新的配置，避免与默认对象共享系列数组 */
export function createDefaultConfig(): ChartBarConfig {
  return {
    // 必要字段默认留空：由用户自己选择后才渲染图表
    categoryField: "",
    title: "",
    valueUnit: "",
    showLegend: true,
    legendPosition: "top",
    horizontal: false,
    barWidth: 16,
    borderRadius: 2,
    showValues: false,
    xLabelRotate: 0,
    showGridY: true,
    yScale: false,
    dataZoom: false,
    // 先放一条空白系列：用户只需要选列，不必先点 +
    series: [{ field: "", color: SERIES_PALETTE[0] }],
  };
}
