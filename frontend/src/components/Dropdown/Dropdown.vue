<template>
  <component
    :is="isChild ? 'li' : 'div'"
    class="dropdown"
    :class="{ 'is-child': isChild }"
    ref="rootRef"
    @mouseenter="handleRootEnter"
    @mouseleave="handleRootLeave"
  >
    <!-- 触发器 -->
    <div
      class="dropdown__trigger"
      :class="{ 'dropdown-item': isChild }"
      ref="triggerRef"
      @click="handleTriggerClick"
    >
      <slot name="trigger" :is-open="isOpen"></slot>
    </div>

    <!-- 面板 -->
    <DropdownPanel
      :is-open="isOpen"
      :position="position"
      :min-width="minWidth"
      :close-on-click-outside="closeOnClickOutside"
      :close-on-escape="closeOnEscape"
      @mount-panel="handlePanelMount"
      @enter-panel="handlePanelEnter"
      @leave-panel="handlePanelLeave"
      @close-panel="closePanel"
    >
      <slot name="panel" :close-panel="closePanel"></slot>
    </DropdownPanel>
  </component>
</template>

<script lang="ts" setup>
import type { Align, TriggerMode, DropdownProps } from "./types";
import {
  computed,
  ref,
  nextTick,
  onBeforeUnmount,
  watch,
  onMounted,
} from "vue";
import { createDropdownContext } from "./useDropdown";
import { usePosition } from "./usePosition";
import DropdownPanel from "./DropdownPanel.vue";

const isOpen = defineModel<boolean>("is-open", { default: false });

const props = withDefaults(defineProps<DropdownProps>(), {
  isDisable: false,
  triggerMode: "click",
  align: "bottom-right",
  closeOnClickOutside: true,
  closeOnEscape: true,
  minWidth: 160,
  offset: 0,
});

const rootRef = ref<HTMLElement>();
const triggerRef = ref<HTMLElement>();
const panelRef = ref<HTMLElement>();

const { context, setRoot, setPanel, bindClose } = createDropdownContext();
const isChild = context.isChild;

const triggerMode = computed<TriggerMode>(() => props.triggerMode);
const align = computed<Align>(() => props.align);
const offset = computed(() => props.offset);

const { position, updatePosition } = usePosition(
  triggerRef,
  panelRef,
  align,
  offset,
);

let closeTimer: ReturnType<typeof setTimeout> | null = null;

function clearCloseTimer() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

function openPanel() {
  if (props.isDisable) return;
  clearCloseTimer();
  isOpen.value = true;
}

function closePanel() {
  if (props.isDisable) return;
  clearCloseTimer();
  if (isOpen.value) {
    isOpen.value = false;
  }
}

function closePanelWithDelay() {
  if (props.isDisable) return;
  clearCloseTimer();
  closeTimer = setTimeout(() => {
    if (isOpen.value) {
      isOpen.value = false;
    }
    closeTimer = null;
  }, 150);
}

function togglePanel() {
  if (props.isDisable) return;
  isOpen.value ? closePanel() : openPanel();
}

function handleTriggerClick() {
  if (props.isDisable) return;
  // 如果是子级且为 hover 模式，点击时不触发 toggle（防止点击子项时因为事件冒泡误关）
  if (isChild && triggerMode.value === "hover") return;

  if (triggerMode.value === "click") {
    togglePanel();
  }
}

function handleRootEnter() {
  if (triggerMode.value !== "hover") return;
  openPanel();
}

function handleRootLeave() {
  if (triggerMode.value !== "hover") return;
  closePanelWithDelay();
}

function handlePanelEnter() {
  if (triggerMode.value !== "hover") return;
  openPanel();
}

function handlePanelLeave() {
  if (triggerMode.value !== "hover") return;
  closePanelWithDelay();
}

const originalEnter = context.notifyParentEnter;
context.notifyParentEnter = () => {
  if (triggerMode.value === "hover") {
    openPanel();
  }
  originalEnter();
};

const originalLeave = context.notifyParentLeave;
context.notifyParentLeave = () => {
  if (triggerMode.value === "hover") {
    closePanelWithDelay();
  }
  originalLeave();
};

function handlePanelMount(el?: HTMLElement) {
  panelRef.value = el;
  setPanel(el);

  if (el) {
    nextTick(() => {
      updatePosition();
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
    });
  } else {
    window.removeEventListener("scroll", updatePosition);
    window.removeEventListener("resize", updatePosition);
  }
}

bindClose(closePanel);

if (context.parentCtx) {
  onBeforeUnmount(context.parentCtx.registerChildClose(closePanel));
}

watch(isOpen, (v) => {
  if (v) {
    nextTick(updatePosition);
  }
});

onMounted(() => {
  setRoot(rootRef.value);
  if (triggerRef.value) {
    onBeforeUnmount(context.registerTrigger(triggerRef.value));
  }

  if (context.parentCtx) {
    onBeforeUnmount(context.parentCtx.registerChildCtx(context));
  }
});

onBeforeUnmount(() => {
  clearCloseTimer();
});
</script>

<style lang="scss" scoped src="./style.scss"></style>
