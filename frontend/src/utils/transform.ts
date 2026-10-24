import { WashyError } from "./error";

/**
 * 将文件转换为纯 Base64 字符串
 *
 * @param file 需要转换的文件对象
 *
 * @returns 纯 Base64 字符串（不包含 data:image/... 前缀）
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // 文件不存在时
    if (!file) {
      reject(new WashyError("fileToBase64: file is empty!"));
      return;
    }

    // 不是图片类型时
    if (!file.type.startsWith("image/")) {
      reject(new WashyError("fileToBase64: file must be photo!"));
      return;
    }

    // 创建文件读取流
    const reader = new FileReader();

    // 读取成功时
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const result = e.target?.result as string;
        // 去掉 "data:image/png;base64," 前缀，保留纯 Base64 字符串
        const base64 = result.split(",")[1];
        resolve(base64);
      } catch (error) {
        reject(
          new WashyError("fileToBase64: transform file to base64 failure!"),
        );
      }
    };

    // 读取失败时
    reader.onerror = () => {
      reject(new WashyError("fileToBase64: read file failure!"));
    };

    // 异步读取文件
    reader.readAsDataURL(file);
  });
}

/**
 * 将文件转换为压缩后的纯 Base64 字符串
 *
 * @param file 需要转换的文件对象
 * @param size 缩放后的最大宽高尺寸
 * @param quality 初始压缩质量 0-1
 * @param maxKB 目标最大体积（KB）
 *
 * @returns 压缩后的纯 Base64 字符串
 */
export function fileToCompressedBase64(
  file: File,
  size: number,
  quality: number,
  maxKB: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new WashyError("fileToCompressedBase64: file is empty!"));
      return;
    }

    if (!file.type.startsWith("image/")) {
      reject(
        new WashyError("fileToCompressedBase64: file must be img format!"),
      );
      return;
    }

    if (size <= 0) {
      reject(new WashyError("fileToCompressedBase64: size must be upper 0!"));
      return;
    }

    if (quality <= 0 || quality > 1) {
      reject(
        new WashyError("fileToCompressedBase64: quality must between 0 to 1!"),
      );
      return;
    }

    if (maxKB <= 0) {
      reject(
        new WashyError("fileToCompressedBase64: target max must upper 0!"),
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const result = e.target?.result as string;

        const img = new Image();

        img.onload = () => {
          try {
            let w = img.width,
              h = img.height;

            if (w > size || h > size) {
              const ratio = Math.min(size / w, size / h);
              w = Math.round(w * ratio);
              h = Math.round(h * ratio);
            }

            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(
                new WashyError(
                  "fileToCompressedBase64: create canvas failure!",
                ),
              );
              return;
            }

            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);

            let curQuality = quality;
            let base64 = "";

            // 递归压缩到目标大小或者质量太低
            function compressToQuality() {
              const dataURL = canvas.toDataURL("image/jpeg", curQuality);
              base64 = dataURL.split(",")[1];

              // 计算当前大小，Base64 字符串长度 * 0.75 = 原始字节数
              const curSizeKB = (base64.length * 0.75) / 1024;

              // 若质量太低且没达到目标大小
              if (curSizeKB > maxKB && curQuality > 0.1) {
                // 降低质量
                curQuality -= 0.05;

                // 递归
                compressToQuality();
              } else {
                resolve(base64);
              }
            }

            compressToQuality();
          } catch (error) {
            reject(
              new WashyError(
                `fileToCompressedBase64: compress img failure, ${error}`,
              ),
            );
          }
        };

        img.onerror = () => {
          reject(new WashyError("fileToCompressedBase64: load file failure!"));
        };

        // 加载图片
        img.src = result;
      } catch (error) {
        reject(
          new WashyError(
            `fileToCompressedBase64: transform file failure, ${error}`,
          ),
        );
      }
    };

    reader.onerror = () => {
      reject(new WashyError("fileToCompressedBase64: read file failure!"));
    };

    reader.readAsDataURL(file);
  });
}
