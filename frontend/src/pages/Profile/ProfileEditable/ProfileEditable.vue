<template>
  <div
    class="profile-editable"
    :class="[`profile-editable--${size}`, { 'is-disabled': disabled }]"
  >
    <!-- 展示态只是一行文字，点击后才切换成输入框 -->
    <input
      v-if="editing"
      ref="inputRef"
      class="profile-editable__input"
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-label="placeholder || undefined"
      spellcheck="false"
      @input="handleInput"
      @blur="handleBlur"
      @keydown.enter.prevent="handleEnter"
      @keydown.esc.prevent="handleEscape"
    />

    <button
      v-else
      type="button"
      class="profile-editable__text"
      :disabled="disabled"
      :title="disabled ? undefined : 'Click to edit'"
      @click="activate"
    >
      <span v-if="modelValue" class="profile-editable__value">
        {{ modelValue }}
      </span>
      <span v-else class="profile-editable__empty">{{ placeholder }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import type { ProfileEditableEmits, ProfileEditableProps } from "./types";
import { nextTick, ref } from "vue";

const props = withDefaults(defineProps<ProfileEditableProps>(), {
  placeholder: "",
  disabled: false,
  size: "text",
});

const emits = defineEmits<ProfileEditableEmits>();

const inputRef = ref<HTMLInputElement | null>(null);

/** 是否处于编辑态：未点击时只显示文字，点击后才渲染输入框 */
const editing = ref(false);

/** 进入编辑前的值，按 Esc 时还原 */
const committed = ref("");

function activate(): void {
  if (props.disabled || editing.value) return;

  committed.value = props.modelValue;
  editing.value = true;

  // 输入框是 v-if 渲染的，等挂载后再聚焦，并把光标放在末尾
  nextTick(() => {
    const input = inputRef.value;

    if (!input) return;

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });
}

function handleInput(event: Event): void {
  emits("update:modelValue", (event.target as HTMLInputElement).value);
}

function handleBlur(): void {
  editing.value = false;
}

/** 回车结束编辑，保存交给外部的 Save 按钮 */
function handleEnter(): void {
  inputRef.value?.blur();
}

/** Esc 放弃本次输入 */
function handleEscape(): void {
  emits("update:modelValue", committed.value);

  inputRef.value?.blur();
}
</script>

<style lang="scss" scoped src="./style.scss"></style>
