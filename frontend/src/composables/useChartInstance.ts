import type { ECharts, EChartsOption } from "echarts";
import * as echarts from "echarts";
import type { Ref } from "vue";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useMutationObserver, useResizeObserver } from "@vueuse/core";

export interface UseChartInstanceOptions {
  /** 组件模板里的根元素 ref，用于监听尺寸 */
  rootRef: Ref<HTMLElement | undefined>;
  /** 图表容器元素 ref */
  chartRef: Ref<HTMLElement | undefined>;
  /** 惰性取 option，避免 setup 阶段就构建 */
  getOption: () => EChartsOption;
  /** 结构性变化（图例 / 缩放条 / 视觉映射）需要整体重绘 */
  getStructureKey: () => string;
  getIsEmpty: () => boolean;
  onRendered?: () => void;
  onError?: (error: Error) => void;
}

/**
 * ECharts 实例生命周期：初始化 / 尺寸跟随 / 明暗主题 / 增量更新 / 销毁
 * 大数据量下统一关闭脏矩形增量渲染，减少重绘抖动
 */
export function useChartInstance(options: UseChartInstanceOptions) {
  const width = ref(0);
  const height = ref(0);
  const isDark = ref(false);

  let chart: ECharts | null = null;
  let resizeFrame = 0;
  let lastStructureKey = "";

  function readIsDark(): boolean {
    return document.documentElement.classList.contains("dark");
  }

  function ensureChart(): ECharts | null {
    if (chart) return chart;
    if (!options.chartRef.value) return null;

    chart = echarts.init(options.chartRef.value, undefined, {
      renderer: "canvas",
      // 关闭脏矩形增量渲染：光标移动 / tooltip 局部重绘会留下断续空白
      useDirtyRect: false,
    });

    return chart;
  }

  function render(): void {
    const instance = ensureChart();

    if (!instance) return;

    if (options.getIsEmpty()) {
      instance.clear();
      lastStructureKey = "";
      return;
    }

    try {
      const key = options.getStructureKey();

      if (key !== lastStructureKey) {
        instance.setOption(options.getOption(), {
          notMerge: true,
          lazyUpdate: true,
        });
      } else {
        instance.setOption(options.getOption(), {
          notMerge: false,
          replaceMerge: ["series"],
          lazyUpdate: true,
        });
      }

      lastStructureKey = key;
      options.onRendered?.();
    } catch (error) {
      options.onError?.(
        error instanceof Error ? error : new Error("Render chart failed"),
      );
    }
  }

  /** 同一帧内的多次触发合并成一次渲染 */
  function schedule(): void {
    if (resizeFrame) return;

    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      render();
    });
  }

  function resize(): void {
    chart?.resize();
    schedule();
  }

  function getInstance(): ECharts | null {
    return chart;
  }

  isDark.value = readIsDark();

  useMutationObserver(
    document.documentElement,
    () => {
      isDark.value = readIsDark();
    },
    { attributes: true, attributeFilter: ["class"] },
  );

  useResizeObserver(options.rootRef, (entries) => {
    const rect = entries[0]?.contentRect;

    if (rect) {
      width.value = Math.round(rect.width);
      height.value = Math.round(rect.height);
    }

    resize();
  });

  onMounted(() => {
    render();
  });

  onBeforeUnmount(() => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);

    resizeFrame = 0;
    chart?.dispose();
    chart = null;
  });

  return { width, height, isDark, render, schedule, resize, getInstance };
}
