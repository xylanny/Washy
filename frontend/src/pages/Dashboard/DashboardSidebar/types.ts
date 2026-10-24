export interface BoardSidebarItem {
  name: string;
  icon: string;
  badge?: string;
}

export interface BoardSidebarProps {
  items: BoardSidebarItem[];
}

export interface BoardSidebarEmits {
  "sidebar-navigate": [name: string];
}
