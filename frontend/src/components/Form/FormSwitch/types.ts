export type FormSwitchValue = boolean | undefined;

export interface FormSwitchProps {
  modelValue?: FormSwitchValue;
  disabled?: boolean;
  loading?: boolean;
  activeText?: string;
  inactiveText?: string;
  activeValue?: boolean;
  inactiveValue?: boolean;
  /** 开关高度（px），宽度按设计稿 7:4 的比例推导 */
  size?: number;
  /** 是否在悬停时用气泡显示当前状态 */
  showTooltip?: boolean;
  /** 气泡的额外类名，用于覆盖 Element Plus 的默认样式 */
  tooltipClass?: string;
  formatValue?: (checked: boolean) => string;
}

export interface FormSwitchSlots {
  tooltip?: (params: { value: FormSwitchValue; display: string }) => any;
}

export interface FormSwitchEmits {
  "update:modelValue": [value: FormSwitchValue];
  change: [value: FormSwitchValue];
}
