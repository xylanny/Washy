import type { ChartOption } from "@/components/Chart/types";
import * as echarts from "echarts";

/** 图表可导出的格式 */
export type ChartExportFormat = "png" | "svg" | "jpeg" | "webp";

/** 导出时使用的画布尺寸 */
export interface ChartImageSize {
  width: number;
  height: number;
}

/** 拿不到图表实际尺寸时的兜底画布 */
export const FALLBACK_IMAGE_SIZE: ChartImageSize = { width: 1280, height: 720 };

/** PNG 按 2 倍密度渲染，避免文字发虚 */
const PIXEL_RATIO = 2;

/** 图表本身是透明的，落盘时统一补白 */
const BACKGROUND_COLOR = "#ffffff";

/** MIME → 扩展名：按实际编码结果修正文件名（JPEG 用 .jpg） */
const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/** 读取 data URL 的 MIME */
function dataUrlMime(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");

  if (!dataUrl.startsWith("data:") || comma < 0) return "";

  const meta = dataUrl.slice(5, comma);
  const separator = meta.indexOf(";");

  return separator === -1 ? meta : meta.slice(0, separator);
}

/**
 * 按真实 MIME 修正扩展名。
 *
 * Canvas 编码 WebP 在不支持的浏览器里会静悄悄退回 PNG，
 * 这时文件名就不能还叫 .webp。
 */
function withMatchingExtension(fileName: string, dataUrl: string): string {
  const extension = MIME_EXTENSIONS[dataUrlMime(dataUrl)];

  if (!extension) return fileName;

  const dot = fileName.lastIndexOf(".");
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;

  return `${base}.${extension}`;
}

/** 把 SVG 字符串转成可直接下载的 data URL */
function toSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** 等一帧，确保离屏画布已经绘制完成再取图 */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "undefined") {
      resolve();

      return;
    }

    // 页面在后台时 rAF 不会触发，兜底一个超时避免导出一动不动
    const timer = setTimeout(resolve, 120);

    requestAnimationFrame(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}

/** data URL → Blob，避免超长 data URL 直接当下载链接时被截断 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, payload = ""] = dataUrl.split(",");
  const separator = meta.indexOf(";");
  const mime = meta.slice(5, separator === -1 ? undefined : separator);

  if (meta.includes(";base64")) {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], { type: mime });
  }

  return new Blob([decodeURIComponent(payload)], {
    type: mime || "image/svg+xml",
  });
}

/**
 * 把 ECharts 配置渲染成图片 data URL
 *
 * 用离屏容器重新渲染，不会影响屏幕上正在显示的实例；
 * 矢量格式走 svg 渲染器，位图格式走 canvas 并提高像素密度。
 */
export async function renderChartImage(
  option: ChartOption,
  format: ChartExportFormat,
  size?: Partial<ChartImageSize>,
): Promise<string> {
  const width = Math.round(size?.width ?? 0) || FALLBACK_IMAGE_SIZE.width;
  const height = Math.round(size?.height ?? 0) || FALLBACK_IMAGE_SIZE.height;
  const isVector = format === "svg";

  const host = document.createElement("div");

  host.style.cssText = [
    "position:fixed",
    "top:-100000px",
    "left:-100000px",
    "pointer-events:none",
    "opacity:0",
    `width:${width}px`,
    `height:${height}px`,
  ].join(";");
  document.body.appendChild(host);

  const chart = echarts.init(host, undefined, {
    renderer: isVector ? "svg" : "canvas",
    width,
    height,
    // 位图的分辨率交给 getDataURL 的 pixelRatio，这里保持 1 倍避免重复放大
    devicePixelRatio: 1,
  });

  try {
    chart.setOption(
      {
        ...option,
        // 导出固定成最终状态：关掉动画、补齐背景
        animation: false,
        backgroundColor: option.backgroundColor ?? BACKGROUND_COLOR,
      },
      { notMerge: true },
    );

    await nextFrame();

    if (isVector) {
      return toSvgDataUrl(chart.renderToSVGString({ useViewBox: true }));
    }

    // ECharts 的类型只声明了 png / jpeg / svg，运行时是把 type 直接拼成
    // `image/<type>` 交给 Canvas，所以 webp 走同一条路径；
    // 浏览器不支持 WebP 编码时 Canvas 会退回 PNG，下载时会按真实 MIME 修正扩展名。
    const options = {
      type: format,
      pixelRatio: PIXEL_RATIO,
      backgroundColor: BACKGROUND_COLOR,
    };

    return chart.getDataURL(
      options as unknown as Parameters<typeof chart.getDataURL>[0],
    );
  } finally {
    chart.dispose();
    host.remove();
  }
}

/** 触发浏览器下载 */
export function downloadChartImage(dataUrl: string, fileName: string): void {
  const url = URL.createObjectURL(dataUrlToBlob(dataUrl));
  const link = document.createElement("a");

  link.href = url;
  link.download = withMatchingExtension(fileName, dataUrl);

  document.body.appendChild(link);
  link.click();
  link.remove();

  // 立刻回收会打断下载，推迟到下一轮再释放
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
