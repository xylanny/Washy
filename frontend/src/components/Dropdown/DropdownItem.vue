<template>
  <li
    tabindex="0"
    class="dropdown-item"
    :class="{ 'is-disable': isDisable }"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
  >
    <slot></slot>
  </li>
</template>

<script lang="ts" setup>
import type { DropdownItemEmits, DropdownItemProps } from "./types";
import { useDropdownContext } from "./useDropdown";

const props = withDefaults(defineProps<DropdownItemProps>(), {
  isDisable: false,
  closeOnClick: true,
});

const emits = defineEmits<DropdownItemEmits>();
const ctx = useDropdownContext();

function handleClick(e: Event) {
  if (props.isDisable) return;
  if (props.closeOnClick) {
    ctx?.closeAllPanels();
  }
  emits("click-item", e);
}
</script>

<style lang="scss" src="./style.scss"></style>
