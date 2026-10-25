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

/**
 * 判断一个未知值是否为数组
 *
 * @param value 未知值
 *
 * @returns 布尔值，若为数组则返回 true
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * 判断一个未知值是否为 undefined
 *
 * @param value 未知值
 *
 * @returns 布尔值
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * 判断一个未知值是否为 null
 *
 * @param value 未知值
 *
 * @returns 布尔值
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * 判断一个未知值是否为空字符串
 *
 * @param value 未知值
 *
 * @returns 布尔值
 */
export function isEmptyString(value: unknown): value is "" {
  return value === "";
}

/**
 * 判断一个未知值是否为空数组
 *
 * @param value 未知值
 *
 * @returns 布尔值
 */
export function isEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length === 0;
}

/**
 * 判断一个未知值是否为 “空值”（当前项目约定undefined、null、""、[] 都为 “空值”）
 */
export function isEmptyValue(value: unknown): boolean {
  return isNil(value) || isEmptyString(value) || isEmptyArray(value);
}

/**
 * 判断一个未知值是否为数字
 *
 * @param value 未知值
 *
 * @returns 布尔值
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}
