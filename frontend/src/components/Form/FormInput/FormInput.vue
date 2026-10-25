<template>
  <div
    class="form-input"
    :class="{
      'is-error': isError,
      'is-disabled': disabled,
      'is-textarea': isTextarea,
    }"
  >
    <textarea
      v-if="isTextarea"
      ref="controlRef"
      class="form-input__inner"
      :id="inputId"
      :value="displayValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :aria-invalid="isError || undefined"
      v-bind="$attrs"
      @input="handleInput"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    ></textarea>

    <input
      v-else
      ref="controlRef"
      class="form-input__inner"
      :id="inputId"
      :type="type"
      :value="displayValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :aria-invalid="isError || undefined"
      v-bind="$attrs"
      @input="handleInput"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <span
      v-if="clearable && hasValue && !disabled && !readonly"
      class="form-input__clear"
      role="button"
      tabindex="0"
      aria-label="Clear value"
      @click="handleClear"
      @keydown.enter.prevent="handleClear"
      @keydown.space.prevent="handleClear"
    >
      <svg
        viewBox="0 0 16 16"
        width="12"
        height="12"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M4.22 4.22a.75.75 0 0 1 1.06 0L8 6.94l2.72-2.72a.75.75 0 1 1 1.06 1.06L9.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L8 9.06l-2.72 2.72a.75.75 0 0 1-1.06-1.06L6.94 8 4.22 5.28a.75.75 0 0 1 0-1.06z"
        />
      </svg>
    </span>
  </div>
</template>

<script lang="ts" setup>
import type { FormInputEmits, FormInputProps, FormInputValue } from "./types";
import { computed, inject, onMounted, onUnmounted, ref } from "vue";
import { formItemContextKey } from "../constants";
import { isEmptyString } from "@/utils/judge";

const props = withDefaults(defineProps<FormInputProps>(), {
  modelValue: undefined,
  type: "text",
  placeholder: "",
  disabled: false,
  readonly: false,
  clearable: false,
  rows: 3,
});

const emits = defineEmits<FormInputEmits>();

const formItem = inject(formItemContextKey, undefined);

const inputId = `form-input-${Math.random().toString(36).slice(2, 9)}`;

const controlRef = ref<HTMLInputElement | HTMLTextAreaElement>();

onMounted(() => formItem?.addInputId(inputId));
onUnmounted(() => formItem?.removeInputId(inputId));

const isError = computed(() => formItem?.validateState === "error");
const isTextarea = computed(() => props.type === "textarea");

const displayValue = computed(() => String(props.modelValue ?? ""));

const hasValue = computed(() => !isEmptyString(displayValue.value));

function readValue(evt: Event): string {
  return (evt.target as HTMLInputElement).value;
}

function emitValue(value: FormInputValue) {
  emits("update:modelValue", value);
}

function handleInput(evt: Event) {
  const value = readValue(evt);

  emitValue(value);

  emits("input", value);
}

function handleChange(evt: Event) {
  const value = readValue(evt);

  emitValue(value);

  emits("change", value);

  formItem?.validate("change");
}

function handleFocus(evt: FocusEvent) {
  emits("focus", evt);
}

function handleBlur(evt: FocusEvent) {
  emits("blur", evt);

  formItem?.validate("blur");
}

function handleClear() {
  emitValue("");
  emits("change", "");
  emits("clear");

  formItem?.validate("change");

  controlRef.value?.focus();
}
</script>

<style lang="scss" scoped src="./style.scss"></style>
