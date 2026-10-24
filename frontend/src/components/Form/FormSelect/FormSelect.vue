<template>
  <div
    class="form-select-wrapper"
    :class="{
      'is-error': isError,
      'is-disabled': disabled,
    }"
  >
    <select
      class="form-select"
      :id="inputId"
      :value="modelValue === undefined ? '' : String(modelValue)"
      :disabled="disabled"
      :aria-invalid="isError || undefined"
      v-bind="attrs"
      @change="handleChange"
      @blur="handleBlur"
      @focus="handleFocus"
    >
      <option value="" disabled hidden>{{ placeholder }}</option>

      <template v-if="options.length">
        <template v-for="option in options" :key="option.value">
          <slot name="option" :option="option">
            <option :value="String(option.value)" :disabled="option.disabled">
              {{ option.label }}
            </option>
          </slot>
        </template>
      </template>
    </select>

    <span
      v-if="clearable && modelValue !== undefined && !disabled"
      class="form-select__clear"
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

    <div v-if="showEmpty" class="form-select__empty">
      <slot name="empty">No data</slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {
  FormSelectEmits,
  FormSelectProps,
  FormSelectValue,
} from "../types";
import { computed, inject, onMounted, onUnmounted, useAttrs } from "vue";
import { formItemContextKey } from "../constants";
import { isEmptyString } from "@/utils/judge";

defineOptions({
  name: "FormSelect",
  // 透传属性由内部的 select 承接，避免重复落到外层容器
  inheritAttrs: false,
});

const props = withDefaults(defineProps<FormSelectProps>(), {
  modelValue: undefined,
  placeholder: "Please select",
  disabled: false,
  clearable: false,
});

const emits = defineEmits<FormSelectEmits>();

const attrs = useAttrs();

const formItem = inject(formItemContextKey, undefined);

const inputId = `form-select-${Math.random().toString(36).slice(2, 9)}`;

onMounted(() => formItem?.addInputId(inputId));
onUnmounted(() => formItem?.removeInputId(inputId));

const isError = computed(() => formItem?.validateState === "error");

const showEmpty = computed(() => !props.options.length && !props.placeholder);

function emitValue(value: FormSelectValue) {
  emits("update:modelValue", value);
  emits("change", value);
}

function handleChange(evt: Event) {
  const raw = (evt.target as HTMLSelectElement).value;
  const matched = props.options.find((option) => String(option.value) === raw);
  const value: FormSelectValue = isEmptyString(raw)
    ? undefined
    : (matched?.value ?? raw);

  emitValue(value);

  formItem?.validate("change");
}

function handleBlur(evt: FocusEvent) {
  emits("blur", evt);

  formItem?.validate("blur");
}

function handleFocus(evt: FocusEvent) {
  emits("focus", evt);
}

function handleClear() {
  emitValue(undefined);

  emits("clear");

  formItem?.validate("change");
}
</script>

<style lang="scss" scoped src="./style.scss"></style>
