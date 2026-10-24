export function isNonNumeric(value: unknown): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  return !Number.isFinite(typeof value === "number" ? value : Number(value));
}

/**
 * 判断一个未知值是否为字符串（这里不考虑包装类型）
 *
 * @param value 未知值
 *
 * @returns 布尔值
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}
