<template>
  <div class="chart-line" style="width: 600px; height: 400px">
    <Chart :option="option" />
  </div>
</template>

<script lang="ts" setup>
import Chart from "@/components/Chart/Chart.vue";
import type { ChartOption } from "@/components/Chart/types";
import { computed } from "vue";

const data = [
  { month: "1月", sales: 1200 },
  { month: "2月", sales: 1800 },
  { month: "3月", sales: 1500 },
];

const option = computed<ChartOption>(() => ({
  title: { text: "sale num" },
  grid: { left: 48, right: 24, top: 32, bottom: 48 },
  xAxis: {
    type: "category",
    data: data.map((e) => e.month),
  },
  yAxis: {
    type: "value",
  },
  series: {
    type: "bar",
    data: data.map((e) => e.sales),
  },
}));
</script>
