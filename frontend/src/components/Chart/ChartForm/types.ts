import type { FormSelectOption } from "@/components/Form/FormSelect/types";
import type { FormRules } from "@/components/Form/types";

/**
 * 配置面板（通用）的 schema
 *
 * 面板不认识任何具体图表：页面把要编辑的字段描述成 group / field，
 * 面板按 control 渲染成现有的 Form 控件，并按 prop 路径读写配置对象。
 */

/** 支持的控件类型 */
export type ChartFormControl =
  | "switch"
  | "select"
  | "segmented"
  | "slider"
  | "color"
  | "input";

export interface ChartFormField {
  /** 配置路径，支持嵌套与下标：lineStyle.width / color[0] / range[1] */
  prop: string;
  label: string;
  control: ChartFormControl;
  /** select / segmented 的选项 */
  options?: FormSelectOption[];
  /** slider 的取值范围 */
  min?: number;
  max?: number;
  step?: number;
  /** 该行是否禁用（由页面按当前配置算好） */
  disabled?: boolean;
  /** 数值展示格式，例如 v => `${v}px` */
  format?: (value: number) => string;
}

export interface ChartFormGroup {
  /** 分组标识（同时作为 Collapse 的 name） */
  name: string;
  title: string;
  fields: ChartFormField[];
  /** 收起时右侧展示的摘要 */
  summary?: string;
}

export interface ChartFormProps {
  /** 被编辑的配置对象（任意图表通用） */
  model: Record<string, any>;
  groups: ChartFormGroup[];
  /** 校验规则，key 与 field.prop 对应 */
  rules?: FormRules;
  /** 默认展开的分组名 */
  defaultOpen?: string[];
}
