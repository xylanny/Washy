<template>
  <div
    class="chart-panel-position"
    role="radiogroup"
    aria-label="Position"
    :class="{ 'is-disabled': disabled }"
  >
    <template v-for="cell in CELLS" :key="cell.id">
      <!-- 中间格留空：图例居中会压住图形 -->
      <span
        v-if="!cell.value"
        class="chart-panel-position__gap"
        aria-hidden="true"
      ></span>

      <button
        v-else
        type="button"
        role="radio"
        class="chart-panel-position__cell"
        :class="{ 'is-active': cell.value === modelValue }"
        :aria-checked="cell.value === modelValue"
        :aria-label="cell.label"
        :title="cell.label"
        :disabled="disabled"
        @click="select(cell.value)"
      >
        <span class="chart-panel-position__dot"></span>
      </button>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type {
  ChartPanelPositionEmits,
  ChartPanelPositionProps,
  ChartPanelPositionValue,
} from "./types";

interface PositionCell {
  id: string;
  value: ChartPanelPositionValue | "";
  label: string;
}

/** 3×3 布局，按行排列；空 value 即中间的占位格 */
const CELLS: PositionCell[] = [
  { id: "top-left", value: "top-left", label: "Top left" },
  { id: "top", value: "top", label: "Top" },
  { id: "top-right", value: "top-right", label: "Top right" },
  { id: "left", value: "left", label: "Left" },
  { id: "center", value: "", label: "" },
  { id: "right", value: "right", label: "Right" },
  { id: "bottom-left", value: "bottom-left", label: "Bottom left" },
  { id: "bottom", value: "bottom", label: "Bottom" },
  { id: "bottom-right", value: "bottom-right", label: "Bottom right" },
];

withDefaults(defineProps<ChartPanelPositionProps>(), {
  modelValue: "",
  disabled: false,
});

const emits = defineEmits<ChartPanelPositionEmits>();

function select(value: ChartPanelPositionValue): void {
  emits("update:modelValue", value);
}
</script>

<style lang="scss" scoped src="./style.scss"></style>
