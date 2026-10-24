export type TriggerMode = "click" | "hover" | "manual";

export type Align = "bottom-right" | "top-right" | "bottom-left";

export interface DropdownProps {
  isOpen?: boolean;
  isDisable?: boolean;
  triggerMode?: TriggerMode;
  align?: Align;
  minWidth?: number;
  offset?: number;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
}

export interface DropdownPanelProps {
  isOpen: boolean;
  minWidth?: number;
  position?: { top: number; left: number };
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
}

export interface DropdownPanelEmits {
  "mount-panel": [el: HTMLElement | undefined];
  "close-panel": [];
  "enter-panel": [];
  "leave-panel": [];
}

export interface DropdownItemProps {
  isDisable?: boolean;
  closeOnClick?: boolean;
}

export interface DropdownItemEmits {
  "click-item": [evt: Event];
}

export interface DropdownContext {
  isChild?: boolean;
  parentCtx?: DropdownContext;
  getRoot: () => HTMLElement | undefined;
  getPanel: () => HTMLElement | undefined;
  getAll: () => HTMLElement[];
  closeCurPanel: () => void;
  closeAllPanels: () => void;
  registerTrigger: (trigger: HTMLElement) => () => void;
  registerChildClose: (close: () => void) => () => void;
  registerChildCtx: (ctx: DropdownContext) => () => void;
  notifyParentEnter: () => void;
  notifyParentLeave: () => void;
}
