export interface FormSelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export type FormSelectValue = string | number | undefined;

export interface FormSelectProps {
  modelValue?: FormSelectValue;
  options: FormSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export interface FormSelectSlots {
  option?: (params: { option: FormSelectOption }) => any;
  empty?: () => any;
}

export interface FormSelectEmits {
  "update:modelValue": [value: FormSelectValue];
  change: [value: FormSelectValue];
  blur: [evt: FocusEvent];
  focus: [evt: FocusEvent];
  clear: [];
}
