import type { Ref } from "vue";

export type CollapseItemName = string | number;

export interface CollapseProps {
  accordion?: boolean;
}

export interface CollapseEmits {
  change: [activeNames: CollapseItemName[]];
}

export interface CollapseContext {
  activeNames: Ref<CollapseItemName[]>;
  handleItemClick(name: CollapseItemName): void;
}

export interface CollapseItemProps {
  name: CollapseItemName;
  title?: string;
  disabled?: boolean;
  /**
   * 是否可展开，默认 true
   *
   * 为 false 时标题仍然可见（自定义图标照常渲染），但点击不再展开/收起，
   * 面板可以用它来收起「暂时没有内容」的分组。
   */
  collapsible?: boolean;
}

export interface CollapseItemEmits {
  beforeChange: [name: CollapseItemName];
}

export interface CollapseItemSlots {
  default?: () => any;
  title?: () => any;
  /**
   * 右侧图标，缺省是展开/收起箭头
   * 传入自定义内容（例如按钮）后，箭头相关的旋转与透明度样式不再生效
   */
  icon?: (params: { isActive: boolean }) => any;
}
