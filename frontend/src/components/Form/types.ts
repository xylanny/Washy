export type ValidateState = "" | "validating" | "success" | "error";

export interface FormItemContext {
  prop: string;
  validateState: ValidateState;
  validate: (trigger: string) => Promise<boolean>;
  resetField: () => void;
  clearValidate: () => void;
  inputIds: string[];
  addInputId: (id: string) => void;
  removeInputId: (id: string) => void;
}

export interface RuleItem {
  required?: boolean;
  message?: string;
  trigger?: "blur" | "change" | Array<"blur" | "change">;
  validator?: (
    value: any,
    model: Record<string, any>,
  ) => boolean | Promise<boolean>;
}

export type FormRules = Record<string, RuleItem | RuleItem[]>;

export interface FormContext {
  model: Record<string, any>;
  rules: FormRules;
  labelWidth: string | number;
  labelPosition: "left" | "right" | "top";
  addField: (field: FormItemContext) => void;
  removeField: (field: FormItemContext) => void;
  validateField: (prop: string, trigger: string) => Promise<boolean>;
  resetField: (prop: string) => void;
}

export interface FormProps {
  model: Record<string, any>;
  rules?: FormRules;
  labelWidth?: string | number;
  labelPosition?: "left" | "right" | "top";
}

export interface FormSlots {
  default?: () => any;
}

export interface FormEmits {
  validate: [prop: string, isValid: boolean, message?: string];
}

export interface FormExposes {
  validate: () => Promise<boolean>;
  validateField: (prop: string, trigger?: string) => Promise<boolean>;
  resetFields: () => void;
  clearValidate: (props?: string[]) => void;
}

export interface FormItemProps {
  prop: string;
  label?: string;
  required?: boolean;
  labelWidth?: string | number;
}

export interface FormItemSlots {
  default?: () => any;
  label?: (param: { label?: string }) => any;
  error?: (param: { message: string }) => any;
}

export interface FormItemExposes {
  validate: (trigger?: string) => Promise<boolean>;
  resetField: () => void;
  clearValidate: () => void;
  validateState: ValidateState;
  validateMessage: string;
}
