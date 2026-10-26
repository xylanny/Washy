/** 位置选位器的取值：3×3 外圈 8 个方位 */
export type ChartPanelPositionValue =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

export interface ChartPanelPositionProps {
  /** 当前方位；不在候选里时不高亮任何格子 */
  modelValue?: string;
  disabled?: boolean;
}

export interface ChartPanelPositionEmits {
  "update:modelValue": [value: ChartPanelPositionValue];
}
