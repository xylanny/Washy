/** 行内可编辑文本属性：平时只展示文字，点击后才变成输入框 */
export interface ProfileEditableProps {
  /** 当前值（受控） */
  modelValue: string;
  /** 空值时的占位提示 */
  placeholder?: string;
  /** 禁用后既不能进入编辑态，也不显示输入框 */
  disabled?: boolean;
  /** 文字层级：title 用于人名，text 用于普通信息 */
  size?: "title" | "text";
}

/** 行内可编辑文本事件 */
export interface ProfileEditableEmits {
  (e: "update:modelValue", value: string): void;
}
