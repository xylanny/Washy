import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * 页面编辑动作的注册表
 *
 * 头部菜单（DashboardHeader 的 Edit）只负责触发，
 * 具体动作由当前页面在挂载时注册、卸载时注销。
 */
export const useEditStore = defineStore("edit", () => {
  const resetHandler = ref<(() => void) | null>(null);

  function registerReset(handler: (() => void) | null): void {
    resetHandler.value = handler;
  }

  /** 只在自己仍是当前注册者时才注销，避免误清掉新页面注册的动作 */
  function unregisterReset(handler: () => void): void {
    if (resetHandler.value === handler) {
      resetHandler.value = null;
    }
  }

  function reset(): void {
    resetHandler.value?.();
  }

  return { resetHandler, registerReset, unregisterReset, reset };
});
