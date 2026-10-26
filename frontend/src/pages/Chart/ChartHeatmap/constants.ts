import type { ChartPanelOption } from "../ChartPanel/types";
import type { ChartHeatmapConfig, ChartHeatmapPalette } from "./types";

/** 配色方案候选 */
export const PALETTE_OPTIONS: ChartPanelOption[] = [
  { label: "Spectrum", value: "spectrum" },
  { label: "Sea", value: "sea" },
  { label: "Warm", value: "warm" },
];

/** 各方案的色带（从低到高） */
export const PALETTES: Record<ChartHeatmapPalette, string[]> = {
  spectrum: [
    "#313695",
    "#4575b4",
    "#74add1",
    "#abd9e9",
    "#e0f3f8",
    "#ffffbf",
    "#fee090",
    "#fdae61",
    "#f46d43",
    "#d73027",
    "#a50026",
  ],
  sea: ["#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"],
  warm: ["#ffffcc", "#ffeda0", "#feb24c", "#f03b20", "#bd0026"],
};

/** 每次 reset 都返回一份全新的配置 */
export function createDefaultConfig(): ChartHeatmapConfig {
  return {
    // 必要字段默认留空：由用户自己选择后才渲染图表
    xField: "",
    title: "",
    valueUnit: "",
    showVisualMap: true,
    showLabels: true,
    palette: "spectrum",
  };
}
