/** 压缩后长边的最大像素 */
export const MAX_IMAGE_EDGE = 1400;

/** JPEG 质量 */
export const IMAGE_QUALITY = 0.82;

/** 原图体积小于该值时不再压缩（图表 PNG 压成 JPEG 反而更糊） */
export const SKIP_COMPRESS_BYTES = 300 * 1024;

/** 允许选择的原图体积上限 */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export interface PreparedImage {
  /** data:image/*;base64 形式的 Data URL */
  url: string;
  name: string;
  width: number;
  height: number;
  /** base64 解码后的近似体积 */
  bytes: number;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read the image file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode the image"));
    image.src = src;
  });
}

function dataUrlBytes(dataUrl: string): number {
  const index = dataUrl.indexOf(",");
  const length = dataUrl.length - (index >= 0 ? index + 1 : 0);
  return Math.round((length * 3) / 4);
}

/**
 * 把用户选的图片整理成可以发给后端的 Data URL：
 * 长边超过 {@link MAX_IMAGE_EDGE} 时等比缩放，并尽量压到几百 KB。
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`${file.name} is larger than 20MB`);
  }

  const dataUrl = await readFileAsDataURL(file);
  const image = await loadImage(dataUrl);

  const longest = Math.max(image.width, image.height, 1);
  const scale = longest > MAX_IMAGE_EDGE ? MAX_IMAGE_EDGE / longest : 1;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  if (scale === 1 && file.size <= SKIP_COMPRESS_BYTES) {
    return { url: dataUrl, name: file.name, width, height, bytes: file.size };
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return { url: dataUrl, name: file.name, width, height, bytes: file.size };
  }

  // 透明 PNG 在深色背景下容易变成黑底，先铺一层白
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const compressed = canvas.toDataURL("image/jpeg", IMAGE_QUALITY);

  return {
    url: compressed,
    name: file.name,
    width,
    height,
    bytes: dataUrlBytes(compressed),
  };
}

/** 体积展示：KB / MB */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/**
 * 把图片居中裁成正方形并转成 JPEG 的 base64（头像用）。
 *
 * @returns 不含 `data:image/jpeg;base64,` 前缀的 base64 字符串
 */
export async function cropSquareImageBase64(
  file: File,
  size: number,
  quality: number,
): Promise<string> {
  const dataUrl = await readFileAsDataURL(file);
  const image = await loadImage(dataUrl);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const side = Math.min(image.width, image.height);

  canvas.width = size;
  canvas.height = size;

  if (!context) return dataUrl.split(",")[1] ?? "";

  // JPEG 没有透明通道，先铺白底避免出现黑边
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    Math.max(0, (image.width - side) / 2),
    Math.max(0, (image.height - side) / 2),
    side,
    side,
    0,
    0,
    size,
    size,
  );

  return canvas.toDataURL("image/jpeg", quality).split(",")[1] ?? "";
}
