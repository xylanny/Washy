<template>
  <div class="collapse-item" :class="{ 'is-disabled': disabled }">
    <div
      class="collapse-item__header"
      :class="{ 'is-disabled': disabled, 'is-active': isActive }"
      role="button"
      :tabindex="disabled ? -1 : 0"
      :aria-expanded="isActive"
      :aria-disabled="disabled || undefined"
      @click="handleClick"
      @keydown.enter.prevent="handleClick"
      @keydown.space.prevent="handleClick"
    >
      <span class="collapse-item__title">
        <slot name="title">{{ title }}</slot>
      </span>

      <!-- disabled 时不显示箭头 -->
      <span v-if="!disabled" class="collapse-item__angle" aria-hidden="true">
        <slot name="icon" :is-active="isActive">
          <svg
            viewBox="0 0 16 16"
            width="12"
            height="12"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <path
              d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06z"
            />
          </svg>
        </slot>
      </span>
    </div>

    <Transition
      name="u-collapse"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @before-leave="onBeforeLeave"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div v-show="isActive" class="collapse-item__wrapper">
        <div class="collapse-item__content" role="region">
          <slot></slot>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import type { CollapseItemProps, CollapseItemEmits } from "./types";
import { computed, inject } from "vue";
import { COLLAPSE_CTX_KEY } from "./constants";

defineOptions({
  name: "QiCollapseItem",
});

const props = defineProps<CollapseItemProps>();
const emits = defineEmits<CollapseItemEmits>();
const ctx = inject(COLLAPSE_CTX_KEY, void 0);

const isActive = computed(() =>
  Boolean(ctx?.activeNames.value.includes(props.name)),
);

async function handleClick(): Promise<void> {
  if (props.disabled) return;

  try {
    emits("beforeChange", props.name);
    ctx?.handleItemClick(props.name);
  } catch (e) {
    // 被拦截
  }
}

// 以下动画逻辑保持不变
function onBeforeEnter(el: Element): void {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = "0";
  htmlEl.style.overflow = "hidden";
}

function onEnter(el: Element): void {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = `${htmlEl.scrollHeight}px`;
}

function onAfterEnter(el: Element): void {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = "";
  htmlEl.style.overflow = "";
}

function onBeforeLeave(el: Element): void {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = `${htmlEl.scrollHeight}px`;
  htmlEl.style.overflow = "hidden";
}

function onLeave(el: Element): void {
  const htmlEl = el as HTMLElement;
  void htmlEl.offsetHeight;
  htmlEl.style.height = "0";
}

function onAfterLeave(el: Element): void {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = "";
  htmlEl.style.overflow = "";
}
</script>

<style lang="scss" src="./style.scss"></style>
