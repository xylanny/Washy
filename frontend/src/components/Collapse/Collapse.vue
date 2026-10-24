<template>
  <div class="collapse">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import type { CollapseItemName, CollapseProps, CollapseEmits } from "./types";
import { computed, provide, watchEffect } from "vue";
import { COLLAPSE_CTX_KEY } from "./constants";
import { debugWarn } from "@/utils/error";

const modelValue = defineModel<CollapseItemName[]>({ default: () => [] });
const props = withDefaults(defineProps<CollapseProps>(), {
  accordion: false,
});
const emits = defineEmits<CollapseEmits>();

const activeNames = computed({
  get: () => modelValue.value || [],
  set: (val) => {
    modelValue.value = val;
    emits("change", val);
  },
});

watchEffect(() => {
  if (props.accordion && activeNames.value.length > 1) {
    debugWarn(
      "components/Collapse",
      "accordion mode should only have one active item",
    );
  }
});

function updateActiveNames(names: CollapseItemName[]): void {
  activeNames.value = names;
}

function handleItemClick(name: CollapseItemName): void {
  const next = [...activeNames.value];

  if (props.accordion) {
    updateActiveNames([next[0] === name ? "" : name]);
    return;
  }

  const index = next.indexOf(name);
  if (index > -1) next.splice(index, 1);
  else next.push(name);

  updateActiveNames(next);
}

provide(COLLAPSE_CTX_KEY, {
  activeNames,
  handleItemClick,
});
</script>

<style lang="scss" scoped src="./style.scss"></style>
