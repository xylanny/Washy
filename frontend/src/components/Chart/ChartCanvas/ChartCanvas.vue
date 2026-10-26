<template>
  <div class="chart-canvas">
    <!-- 画布只负责容器与空态，具体图表由页面通过插槽组装 -->
    <slot v-if="!empty" />

    <div v-else class="chart-canvas__empty">
      <p class="chart-canvas__empty-title">{{ emptyTitle }}</p>
      <p v-if="emptyHint" class="chart-canvas__empty-hint">{{ emptyHint }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ChartCanvasProps } from "./types";

withDefaults(defineProps<ChartCanvasProps>(), {
  empty: false,
  emptyTitle: "No data",
  emptyHint: "",
});
</script>

<style lang="scss" scoped src="./style.scss"></style>
