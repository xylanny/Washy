import type { FormSelectOption } from "@/components/Form/FormSelect/types";
import type { Component } from "vue";

/** 面板可写回的值类型 */
export type ChartPanelValue = string | number | boolean;

/** 选项与 FormSelect 保持一致 */
export type ChartPanelOption = FormSelectOption;

/** 单字段变更 */
export interface ChartPanelFieldChange {
  key: string;
  value: ChartPanelValue;
}

/** 系列行变更 */
export interface ChartPanelItemChange {
  index: number;
  key: string;
  value: ChartPanelValue;
}

/** 各图表的分组字段组件都会发出这几类事件 */
export interface ChartFieldsEmits {
  "update:field": [change: ChartPanelFieldChange];
  "update:item": [change: ChartPanelItemChange];
  "add:item": [];
  "remove:item": [index: number];
}

/** 一个分组：Tab 名称 + 该组的表单组件 + 传给它的 props */
export interface ChartPanelTab {
  name: string;
  label: string;
  component: Component;
  props?: Record<string, unknown>;
}

export interface ChartPanelProps {
  /** 表单模型（图表配置对象） */
  model: Record<string, unknown>;
  tabs: ChartPanelTab[];
  /** 头部展示的标题，点击后可编辑 */
  title?: string;
  /** 标题为空时的显示文案 */
  titlePlaceholder?: string;
}

export interface ChartPanelEmits {
  "update:field": [change: ChartPanelFieldChange];
  "update:item": [change: ChartPanelItemChange];
  "add:item": [];
  "remove:item": [index: number];
  "update:title": [value: string];
}
