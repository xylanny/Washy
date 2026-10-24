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
}

export interface CollapseItemEmits {
  beforeChange: [name: CollapseItemName];
}
