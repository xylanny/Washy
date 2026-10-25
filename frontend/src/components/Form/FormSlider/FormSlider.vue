<template>
  <!-- 注意将父组件传递的没有声明为统一Props的属性，透传给底层DOM元素 -->
  <div
    class="form-slider"
    :class="{
      'is-error': isError,
      'is-disabled': disabled,
    }"
    :style="{ '--form-slider-fill': fill }"
    @mouseenter="handlePointerEnter"
    @mouseleave="handlePointerLeave"
    v-bind="$attrs"
  >
    <input
      type="range"
      class="form-slider__input"
      :id="inputId"
      :min="min"
      :max="max"
      :step="step"
      :value="currentValue"
      :disabled="disabled"
      :aria-invalid="isError"
      :aria-valuetext="valueText"
      @input="handleInput"
      @change="handleChange"
      @pointerdown="handlePointerDown"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <div class="form-slider__track">
      <el-tooltip
        ref="tooltipRef"
        :visible="tooltipVisible"
        :disabled="disabled || !showTooltip"
        placement="top"
        :fallback-placements="['top', 'bottom', 'right', 'left']"
        :popper-class="tooltipClass"
        transition="el-fade-in-linear"
        persistent
      >
        <template #content>
          <slot name="tooltip" :value="currentValue" :display="valueText">
            {{ valueText }}
          </slot>
        </template>

        <span class="form-slider__thumb"></span>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TooltipInstance } from "element-plus";
import type {
  FormSliderSlots,
  FormSliderEmits,
  FormSliderProps,
  FormSliderValue,
} from "./types";
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import { formItemContextKey } from "../constants";
import { isNumber, isUndefined } from "@/utils/judge";

const props = withDefaults(defineProps<FormSliderProps>(), {
  modelValue: undefined,
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  showTooltip: true,
  tooltipClass: "",
  formatValue: undefined,
});

const emits = defineEmits<FormSliderEmits>();

defineSlots<FormSliderSlots>();

const formItem = inject(formItemContextKey, undefined);

const inputId = `form-slider-${Math.random().toString(36).slice(2, 9)}`;

onMounted(() => formItem?.addInputId(inputId));
onUnmounted(() => formItem?.removeInputId(inputId));

const isError = computed(() => formItem?.validateState === "error");

const currentValue = computed(() =>
  isNumber(props.modelValue) ? props.modelValue : props.min,
);

/** 滑块已完成部分的百分比，同时驱动轨道渐变与气泡位置 */
const fill = computed(() => {
  if (props.max <= props.min) {
    return "0%";
  }

  const percent =
    ((currentValue.value - props.min) / (props.max - props.min)) * 100;

  return `${Math.min(100, Math.max(0, percent))}%`;
});

function format(v: number): string {
  return props.formatValue ? props.formatValue(v) : String(v);
}

const valueText = computed(() => format(currentValue.value));

const tooltipRef = ref<TooltipInstance>();
const tooltipVisible = ref(false);
const isHovering = ref(false);
const isDragging = ref(false);

function openTooltip() {
  if (props.disabled || !props.showTooltip) return;

  tooltipVisible.value = true;
}

function closeTooltip() {
  tooltipVisible.value = false;
}

/** 值变化后等 DOM 更新再让气泡重新定位，实现气泡跟随滑块 */
function syncTooltip() {
  nextTick(() => tooltipRef.value?.updatePopper());
}

function handlePointerEnter() {
  isHovering.value = true;
  openTooltip();
}

function handlePointerLeave() {
  isHovering.value = false;

  if (!isDragging.value) closeTooltip();
}

function handleFocus() {
  openTooltip();
}

function handleBlur() {
  if (!isHovering.value && !isDragging.value) closeTooltip();
}

function handlePointerDown() {
  isDragging.value = true;
  openTooltip();

  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);
}

function handlePointerUp() {
  isDragging.value = false;

  window.removeEventListener("pointerup", handlePointerUp);
  window.removeEventListener("pointercancel", handlePointerUp);

  if (!isHovering.value) closeTooltip();
}

function resolveValue(input: Event | FormSliderValue): FormSliderValue {
  if (isNumber(input) || isUndefined(input)) {
    return input;
  }

  const target = input.target as HTMLInputElement;
  return Number(target.value);
}

function handleInput(input: Event | FormSliderValue): void {
  const value = resolveValue(input);

  emits("update:modelValue", value);

  emits("input", value);
}

function handleChange(input: Event | FormSliderValue): void {
  const value = resolveValue(input);

  emits("update:modelValue", value);

  emits("change", value);

  formItem?.validate("change");
}

watch(
  () => props.disabled,
  (disabled) => {
    if (!disabled) return;

    isDragging.value = false;
    closeTooltip();
  },
);

// 值变化（拖动、键盘、外部更新）后让气泡重新定位，实现跟随滑块
watch(currentValue, () => {
  if (tooltipVisible.value) syncTooltip();
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerup", handlePointerUp);
  window.removeEventListener("pointercancel", handlePointerUp);
});
</script>

<style lang="scss" scoped src="./style.scss"></style>
