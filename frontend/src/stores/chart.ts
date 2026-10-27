import type { ChartOption } from "@/components/Chart/types";
import type { ChartExportFormat, ChartImageSize } from "@/utils/chartExport";
import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";

/** 图表页类型，用于导出文件的兜底命名 */
export type ChartPageType = "line" | "bar" | "pie" | "scatter" | "heatmap";

/** 文件名里不允许出现的字符 */
const INVALID_FILE_CHARS = /[\\/:*?"<>|\s]+/g;

/** 标题 → 安全的文件名（不带扩展名） */
function toFileName(text: string): string {
  return text.replace(INVALID_FILE_CHARS, "-").replace(/^-+|-+$/g, "");
}

/** 从配置里读标题（ECharts 的 title 可能写成数组） */
function readTitle(option: ChartOption | null): string {
  const raw = (option as { title?: unknown } | null)?.title;
  const item = Array.isArray(raw) ? raw[0] : raw;
  const text =
    item && typeof item === "object"
      ? (item as { text?: unknown }).text
      : undefined;

  return typeof text === "string" ? text.trim() : "";
}

/**
 * 图表页共用的 ECharts 配置
 *
 * 所有图表页同一时刻只保留一份配置：页面进入时先把上一个页面留下的配置换掉，
 * 正在渲染的 Chart 组件每次渲染后把最终配置回填，头部 Save 直接导出这份配置。
 */
export const useChartStore = defineStore("chart", () => {
  /** 当前图表页正在渲染的 ECharts 配置 */
  const option = shallowRef<ChartOption | null>(null);
  /** 当前图表页类型，仅用于导出文件名 */
  const page = ref<ChartPageType | "">("");
  /** 屏幕上图表的实际尺寸，导出时按它保持比例 */
  const size = shallowRef<ChartImageSize>({ width: 0, height: 0 });
  /** 是否正在导出 */
  const saving = ref(false);

  /** 记录配置来自哪个快照，避免旧图表卸载时清掉新页面的配置 */
  let owner: ChartOption | null = null;

  const canSave = computed(() => Boolean(option.value));

  function reset(): void {
    owner = null;
    option.value = null;
    size.value = { width: 0, height: 0 };
  }

  /** 进入图表页：先替换掉上一个页面留下的配置，避免导出到旧图表 */
  function enterPage(type: ChartPageType): void {
    page.value = type;
    reset();
  }

  /** 离开图表页：确认配置还属于自己时才清空 */
  function leavePage(type: ChartPageType): void {
    if (page.value !== type) return;

    page.value = "";
    reset();
  }

  /** Chart 组件渲染完成后回填当前配置与尺寸 */
  function publish(next: ChartOption, nextSize: ChartImageSize): void {
    owner = next;
    option.value = next;
    size.value = { ...nextSize };
  }

  /** 容器尺寸变化时只更新尺寸 */
  function publishSize(source: ChartOption, nextSize: ChartImageSize): void {
    if (owner !== source) return;

    size.value = { ...nextSize };
  }

  /** 图表卸载时清空快照，只清自己发布的那份 */
  function clear(source: ChartOption | null): void {
    if (!source || owner !== source) return;

    reset();
  }

  /** 导出文件名：优先用图表标题，没有标题时用页面类型兜底 */
  function resolveFileName(format: ChartExportFormat): string {
    const title = toFileName(readTitle(option.value));
    const fallback = `washy-${page.value || "chart"}-chart`;

    // 扩展名由下载时按真实 MIME 校正（jpeg → .jpg）
    return `${title || fallback}.${format}`;
  }

  /** 导出当前图表，返回是否成功 */
  async function saveAs(format: ChartExportFormat): Promise<boolean> {
    const snapshot = option.value;

    if (!snapshot || saving.value) return false;

    saving.value = true;

    try {
      // 动态引入：echarts 只在真正导出时才加载，不拖累首屏
      const { downloadChartImage, renderChartImage } =
        await import("@/utils/chartExport");
      const dataUrl = await renderChartImage(snapshot, format, size.value);

      downloadChartImage(dataUrl, resolveFileName(format));

      return true;
    } catch (error) {
      console.error(error);

      return false;
    } finally {
      saving.value = false;
    }
  }

  return {
    option,
    page,
    size,
    saving,
    canSave,
    enterPage,
    leavePage,
    publish,
    publishSize,
    clear,
    saveAs,
  };
});
