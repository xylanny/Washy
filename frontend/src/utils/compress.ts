import { WashyError } from "./error";

/**
 * 压缩 Base64 图片
 *
 * @param base64 图片的 Base64 字符串
 * @param size 缩放后的最大宽高尺寸，默认 500
 * @param quality 压缩质量 0-1，默认 0.8
 *
 * @returns 压缩后的纯 Base64 字符串
 */
export function compressBase64(
  base64: string,
  size: number = 500,
  quality: number = 0.8,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 若 Base64 字符串为空
    if (!base64) {
      reject(new WashyError("compressBase64: base64 is empty!"));
      return;
    }

    const dataURL = base64.startsWith("data:image/")
      ? base64
      : `data:image/jpeg;base64,${base64}`;

    const img = new Image();
    img.onload = () => {
      try {
        // 计算缩放尺寸
        let w = img.width,
          h = img.height;
        if (w > size || h > size) {
          const ratio = Math.min(size / w, size / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        // 绘制到 Canvas
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(
            new WashyError("compressBase64: create canvas element failure!"),
          );
          return;
        }

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const compressedDataURL = canvas.toDataURL("image/jpeg", quality);
        const compressBase64 = compressedDataURL.split(",")[1];
        resolve(compressBase64);
      } catch (error) {
        reject(new WashyError("compressBase64: compress base64 failure"));
      }
    };

    img.onerror = () => {
      reject(new WashyError("compressBase64: load image failure!"));
    };

    img.src = dataURL;
  });
}
