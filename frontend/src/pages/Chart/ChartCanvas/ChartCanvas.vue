<template>
  <section class="chart-canvas">
    <div class="chart-canvas__surface">
      <slot v-if="!empty"></slot>

      <!-- 统一的空态：所有图表共用 -->
      <div v-else class="chart-canvas__empty">
        <span class="chart-canvas__empty-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3.5 3.5v17h17" />
            <path d="M7 16l3.6-4.2 3 2.6L20 7.5" />
            <circle cx="7" cy="16" r="1" />
            <circle cx="10.6" cy="11.8" r="1" />
            <circle cx="13.6" cy="14.4" r="1" />
          </svg>
        </span>

        <p class="chart-canvas__empty-title">No chart preview</p>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { ChartCanvasProps } from "./types";

withDefaults(defineProps<ChartCanvasProps>(), {
  empty: false,
});
</script>

<style lang="scss" scoped src="./style.scss"></style>
