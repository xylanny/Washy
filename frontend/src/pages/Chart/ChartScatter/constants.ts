import type { ChartScatterConfig } from "./types";

/** 每次 reset 都返回一份全新的配置 */
export function createDefaultConfig(): ChartScatterConfig {
  return {
    // 必要字段默认留空：由用户自己选择后才渲染图表
    xField: "",
    yField: "",
    title: "",
    valueUnit: "",
    showLegend: false,
    legendPosition: "top",
    symbol: "circle",
    symbolSize: 8,
    opacity: 70,
    showGrid: true,
    dataZoom: false,
  };
}
