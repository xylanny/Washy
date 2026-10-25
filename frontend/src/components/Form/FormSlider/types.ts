export type FormSliderValue = number | undefined;

export interface FormSliderProps {
  modelValue?: FormSliderValue;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** 是否在悬停/滑动时用气泡显示当前值 */
  showTooltip?: boolean;
  /** 气泡的额外类名，用于覆盖 Element Plus 的默认样式 */
  tooltipClass?: string;
  formatValue?: (value: number) => string;
}

export interface FormSliderSlots {
  tooltip?: (params: { value: number; display: string }) => any;
}

export interface FormSliderEmits {
  "update:modelValue": [value: FormSliderValue];
  input: [value: FormSliderValue];
  change: [value: FormSliderValue];
}
