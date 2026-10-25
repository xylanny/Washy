export type FormInputValue = string | number | undefined;

export type FormInputType =
  | "text"
  | "password"
  | "number"
  | "email"
  | "search"
  | "tel"
  | "url"
  | "textarea";

export interface FormInputProps {
  modelValue?: FormInputValue;
  type?: FormInputType;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  // 仅 type="textarea" 生效，表示文本域行数
  rows?: number;
}

export interface FormInputEmits {
  "update:modelValue": [value: FormInputValue];
  input: [value: string];
  change: [value: string];
  focus: [evt: FocusEvent];
  blur: [evt: FocusEvent];
  clear: [];
}
