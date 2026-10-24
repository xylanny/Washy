<template>
  <Teleport to="body">
    <ul
      v-if="isOpen"
      class="dropdown-panel"
      :style="panelStyles"
      ref="panelRef"
      @mousedown.stop
      @mouseenter="handleEnter"
      @mouseleave="handleLeave"
    >
      <slot :close-panel="closePanel"></slot>
    </ul>
  </Teleport>
</template>

<script lang="ts" setup>
import type { DropdownPanelEmits, DropdownPanelProps } from "./types";
import { useDropdownContext } from "./useDropdown";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import { CLOSE_KEY } from "./constants";

const props = withDefaults(defineProps<DropdownPanelProps>(), {
  minWidth: 160,
  closeOnClickOutside: true,
  closeOnEscape: true,
  position: () => ({ top: 0, left: 0 }),
});

const emits = defineEmits<DropdownPanelEmits>();
const ctx = useDropdownContext();
const panelRef = ref<HTMLElement>();

const panelStyles = computed<CSSProperties>(() => ({
  position: "fixed",
  top: `${props.position.top}px`,
  left: `${props.position.left}px`,
  minWidth: `${props.minWidth}px`,
  zIndex: 10,
}));

function closePanel() {
  emits("close-panel");
}

function handleEnter() {
  emits("enter-panel");
  ctx?.notifyParentEnter();
}

function handleLeave() {
  emits("leave-panel");
  ctx?.notifyParentLeave();
}

function handleClickOutside(e: MouseEvent) {
  if (!props.isOpen || !props.closeOnClickOutside) return;
  const target = e.target as Node;
  const els = ctx?.getAll() ?? [];
  const isInside = els.some((el) => el.contains(target));
  if (!isInside) closePanel();
}

function handleClickEscape(e: KeyboardEvent) {
  if (!props.isOpen || !props.closeOnEscape) return;
  if (e.key === CLOSE_KEY) closePanel();
}

watch(panelRef, (el) => emits("mount-panel", el ?? undefined), {
  immediate: true,
});

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
  document.addEventListener("keydown", handleClickEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  document.removeEventListener("keydown", handleClickEscape);
  emits("mount-panel", undefined);
});
</script>

<style lang="scss" scoped src="./style.scss"></style>
