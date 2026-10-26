import type { ChartPanelOption } from "../ChartPanel/types";
import type { ChartLineConfig } from "./types";
import { SERIES_PALETTE } from "../constants";

/** 折线形态候选 */
export const SHAPE_OPTIONS: ChartPanelOption[] = [
  { label: "Straight", value: "straight" },
  { label: "Smooth", value: "smooth" },
  { label: "Step start", value: "step-start" },
  { label: "Step middle", value: "step-middle" },
  { label: "Step end", value: "step-end" },
];

/** 线型候选 */
export const DASH_OPTIONS: ChartPanelOption[] = [
  { label: "Solid", value: "solid" },
  { label: "Dashed", value: "dashed" },
  { label: "Dotted", value: "dotted" },
];

/** 每次 reset 都返回一份全新的配置，避免与默认对象共享系列数组 */
export function createDefaultConfig(): ChartLineConfig {
  return {
    // 必要字段默认留空：由用户自己选择后才渲染图表
    categoryField: "",
    // 标题留空时面板头部显示 Untitled，点开即可编辑
    title: "",
    valueUnit: "",
    showLegend: true,
    legendPosition: "top",
    shape: "smooth",
    area: false,
    areaOpacity: 60,
    lineWidth: 2,
    lineDash: "solid",
    symbol: "emptyCircle",
    symbolSize: 6,
    showValues: false,
    xLabelRotate: 0,
    yScale: false,
    showGridY: true,
    dataZoom: false,
    // 先放一条空白系列：用户只需要选列，不必先点 +
    series: [{ field: "", color: SERIES_PALETTE[0] }],
  };
}
