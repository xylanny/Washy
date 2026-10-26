/** 图例停靠位置：3×3 选位器外圈 8 个方位 */
export type ChartLegendPosition =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

/** 图例停靠方式的 ECharts 片段 */
export interface ChartLegendPlacement {
  top?: number | "middle";
  left?: number | "center";
  right?: number;
  bottom?: number;
  orient?: "horizontal" | "vertical";
}

/** 竖向图例在左右两侧时给 grid 预留的宽度 */
export const LEGEND_SIDE_SPACE = 96;

/** 底部图例给 grid 预留的高度 */
export const LEGEND_BOTTOM_SPACE = 26;

/** 把 3×3 选位器的外圈方位翻译成图例的停靠方式 */
export function placeLegend(
  position: ChartLegendPosition = "top",
  offsets: { top?: number; bottom?: number } = {},
): ChartLegendPlacement {
  const top = offsets.top ?? 8;
  const bottom = offsets.bottom ?? 8;

  switch (position) {
    case "top-left":
      return { top, left: 0 };
    case "top-right":
      return { top, right: 0 };
    case "left":
      return { left: 0, top: "middle", orient: "vertical" };
    case "right":
      return { right: 0, top: "middle", orient: "vertical" };
    case "bottom-left":
      return { bottom, left: 0 };
    case "bottom":
      return { bottom, left: "center" };
    case "bottom-right":
      return { bottom, right: 0 };
    case "top":
    default:
      return { top, left: "center" };
  }
}

export function isLegendAtTop(position: ChartLegendPosition): boolean {
  return position === "top" || position.startsWith("top-");
}

export function isLegendAtBottom(position: ChartLegendPosition): boolean {
  return position.startsWith("bottom");
}

export function isLegendAtSide(position: ChartLegendPosition): boolean {
  return position === "left" || position === "right";
}
