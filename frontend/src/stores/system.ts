import { defineStore } from "pinia";
import { usePreferredDark, useStorage } from "@vueuse/core";
import { computed, watch } from "vue";

export type ThemeMode = "light" | "dark" | "system";

export const useSystemStore = defineStore("system", () => {
  const themeMode = useStorage<ThemeMode>("theme-mode", "system");
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
    themeMode,
  };
});
