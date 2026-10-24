import { computed, ref } from "vue";
import type { ComputedRef, Ref } from "vue";

export interface VirtualListConfig {
  unitH: number; // 每行高度
  total: number | Ref<number> | ComputedRef<number>; // 响应式总行数
  visibleH: number; // 可视区高度
  bufferN?: number; // 缓冲区行数
}

export function useVirtualList(config: VirtualListConfig) {
  const { unitH, total, visibleH, bufferN = 10 } = config;
  // 总行数
  const totalN = computed(() => {
    if (typeof total === "number") return total;
    else return total.value;
  });
  // 内容总高度
  const contentH = computed(() => unitH * totalN.value);
  // 可视区行数，至少一行
  const visibleN = Math.max(1, Math.ceil(visibleH / unitH));

  const scrollTop = ref(0);
  // 开始索引
  const sIdx = computed(() =>
    Math.max(0, Math.floor(scrollTop.value / unitH) - bufferN),
  );
  // 结束索引
  const eIdx = computed(() =>
    Math.min(totalN.value, sIdx.value + visibleN + bufferN * 2),
  );
  // 可视行范围
  const visibleR = computed(() => ({
    start: sIdx.value,
    end: eIdx.value,
  }));
  const offsetY = computed(() => sIdx.value * unitH);

  /**
   * 获取可见数据
   * @param {T} data 完整数据数组
   * @returns 可见区域的数据切片
   */
  function getVisibleData<T>(data: T[]): T[] {
    if (!data || data.length === 0) return [];
    const { start, end } = visibleR.value;

    return data.slice(start, end);
  }

  /**
   * 设置滚动位置
   * @param {number} value 目标滚动值
   */
  function setScrollTop(value: number) {
    scrollTop.value = Math.max(0, Math.min(value, contentH.value - visibleH));
  }

  /**
   * 重置滚动到顶部
   */
  function resetScrollTop() {
    scrollTop.value = 0;
  }

  function scrollTo(idx: number) {
    const target = Math.max(0, idx * unitH);

    setScrollTop(target);
  }

  return {
    scrollTop,
    contentH,
    sIdx,
    eIdx,
    visibleR,
    offsetY,
    getVisibleData,
    setScrollTop,
    resetScrollTop,
    scrollTo,
  };
}
