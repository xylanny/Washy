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
      @click="handleClear"
    >
      x
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
} from "./types";
import { computed, inject, onMounted, onUnmounted, useAttrs } from "vue";
import { formItemContextKey } from "element-plus";
import { isEmptyString } from "@/utils/judge";

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
