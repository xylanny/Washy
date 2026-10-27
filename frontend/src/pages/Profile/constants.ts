/** 上传的头像统一裁成 256×256 的 JPEG */
export const AVATAR_SIZE = 256;

/** JPEG 压缩质量 */
export const AVATAR_QUALITY = 0.9;

/** 头像文件大小上限：5 MB */
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/** 头像展示前缀，与侧边栏保持一致 */
export const AVATAR_DATA_PREFIX = "data:image/jpeg;base64,";

/** 关闭图标（错误提示用） */
export const ICON_SVG_CLOSE = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M6.2 6.2l11.6 11.6M17.8 6.2L6.2 17.8"/></svg>`;
