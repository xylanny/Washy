import { version as packageVersion } from "../../package.json";
import { defineStore } from "pinia";
import { usePreferredDark, useStorage } from "@vueuse/core";
import { computed, watch } from "vue";

export type ThemeMode = "light" | "dark" | "system";

/** 图表画布默认最多渲染的点数（可在设置里调整） */
export const DEFAULT_CHART_POINTS = 2_000;

export const useSystemStore = defineStore("system", () => {
  /** 版本号来自 package.json 的 version 字段 */
  const version = packageVersion;

  const themeMode = useStorage<ThemeMode>("theme-mode", "system");
  /** 图表最多渲染的点数 */
  const chartPoints = useStorage<number>("chart-points", DEFAULT_CHART_POINTS);
  /** 表格是否使用紧凑行高 */
  const compactTable = useStorage<boolean>("compact-table", false);

  const systemPrefersDark = usePreferredDark();
  const isDark = computed(() => {
    if (themeMode.value === "system") {
      return systemPrefersDark.value;
    }
    return themeMode.value === "dark";
  });

  watch(
    [themeMode, isDark],
    ([_, dark]) => {
      document.documentElement.classList.toggle("dark", dark);
    },
    { immediate: true },
  );

  return {
    version,
    themeMode,
    chartPoints,
    compactTable,
  };
});
