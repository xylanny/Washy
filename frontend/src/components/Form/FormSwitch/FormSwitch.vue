<template>
  <div
    class="form-switch"
    :class="{
      'is-checked': isChecked,
      'is-disabled': isDisabled,
      'is-loading': loading,
      'is-error': isError,
    }"
    :style="switchStyle"
    @keydown.enter.prevent="handleEnter"
  >
    <label class="form-switch__label" :for="inputId">
      <input
        class="form-switch__input"
        type="checkbox"
        :id="inputId"
        :checked="isChecked"
        :disabled="isDisabled"
        :aria-invalid="isError"
        :aria-busy="loading"
        v-bind="$attrs"
        @change="handleChange"
      />

      <!-- 气泡显示当前状态，悬停时出现 -->
      <el-tooltip
        :disabled="isDisabled || !showTooltip"
        placement="top"
        :popper-class="tooltipClass"
        transition="el-fade-in-linear"
      >
        <template #content>
          <slot name="tooltip" :value="modelValue" :display="tooltipText">
            {{ tooltipText }}
          </slot>
        </template>

        <span class="form-switch__track" aria-hidden="true">
          <span class="form-switch__thumb"></span>
        </span>
      </el-tooltip>
    </label>
  </div>
</template>

<script lang="ts" setup>
import type {
  FormSwitchEmits,
  FormSwitchProps,
  FormSwitchSlots,
  FormSwitchValue,
} from "./types";
import { computed, inject, onMounted, onUnmounted } from "vue";
import { formItemContextKey } from "../constants";

const props = withDefaults(defineProps<FormSwitchProps>(), {
  modelValue: undefined,
  disabled: false,
  loading: false,
  activeText: "",
  inactiveText: "",
  activeValue: true,
  inactiveValue: false,
  size: 16,
  showTooltip: true,
  tooltipClass: "",
  formatValue: undefined,
});

const emits = defineEmits<FormSwitchEmits>();

defineSlots<FormSwitchSlots>();

const formItem = inject(formItemContextKey, undefined);

const inputId = `form-switch-${Math.random().toString(36).slice(2, 9)}`;

onMounted(() => formItem?.addInputId(inputId));
onUnmounted(() => formItem?.removeInputId(inputId));

const isChecked = computed(() => props.modelValue === props.activeValue);
const isError = computed(() => formItem?.validateState === "error");
const isDisabled = computed(() => props.disabled || props.loading);

const currentValue = computed<FormSwitchValue>(() =>
  isChecked.value ? props.activeValue : props.inactiveValue,
);

/** size 作为开关高度，宽度、滑块与内边距按比例推导 */
const switchStyle = computed(() => {
  const height = Math.max(props.size, 12);
  const width = Math.round((height * 7) / 4);

  return {
    "--form-switch-height": `${height}px`,
    "--form-switch-width": `${width}px`,
    "--form-switch-thumb": `${Math.max(height - 6, 4)}px`,
    "--form-switch-gap": "2px",
  };
});

const stateText = computed(() =>
  isChecked.value ? props.activeText : props.inactiveText,
);

const tooltipText = computed(() => {
  if (props.formatValue) return props.formatValue(isChecked.value);

  return stateText.value || String(currentValue.value);
});

function resolveValue(checked: boolean): FormSwitchValue {
  return checked ? props.activeValue : props.inactiveValue;
}

function emitValue(value: FormSwitchValue) {
  emits("update:modelValue", value);

  emits("change", value);

  formItem?.validate("change");
}

function handleChange(evt: Event) {
  const target = evt.target as HTMLInputElement;

  emitValue(resolveValue(target.checked));

  // 非受控场景下 input 会保留原生勾选状态，受控场景交给 modelValue 决定
  target.checked = isChecked.value;
}

/** Space 由原生 checkbox 处理，这里只补 Enter */
function handleEnter() {
  if (isDisabled.value) return;

  emitValue(resolveValue(!isChecked.value));
}
</script>

<style lang="scss" scoped src="./style.scss"></style>
