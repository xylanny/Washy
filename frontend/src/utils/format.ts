import { throwError } from "./error";

/**
 * 补零函数
 * @param n 需要补零的数字
 * @returns 补零后的字符串
 */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * 格式化日期
 * @param date 日期对象
 * @param format 格式化模板，默认 'YYYY-MM-DD'
 * @returns 格式化后的日期字符串
 *
 * @example
 * formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss') // '2026-09-09 20:13:12'
 * formatDate(new Date(), 'YYYY年MM月DD日') // '2026年09月09日'
 */
export function formatDate(date: Date, format: string = "YYYY-MM-DD"): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throwError("formatDate", "Invalid date object");
  }

  const year: number = date.getFullYear();
  const month: number = date.getMonth() + 1;
  const day: number = date.getDate();
  const hour: number = date.getHours();
  const minutes: number = date.getMinutes();
  const seconds: number = date.getSeconds();

  const map: Record<string, string> = {
    YYYY: String(year),
    MM: pad(month),
    DD: pad(day),
    HH: pad(hour),
    mm: pad(minutes),
    ss: pad(seconds),
  };

  return format.replace(
    /YYYY|MM|DD|HH|mm|ss/g,
    (key: string): string => map[key],
  );
}

/** 图表里的紧凑数值格式化：点位 / 行数，例如 123456 → 123k */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "0";

  const trim = (input: number): string =>
    Number.isInteger(input) ? String(input) : input.toFixed(1);

  if (Math.abs(value) >= 1_000_000) return `${trim(value / 1_000_000)}M`;
  if (Math.abs(value) >= 1_000) return `${trim(value / 1_000)}k`;

  return value.toLocaleString();
}

/** 图表数值格式化：坐标轴 / tooltip 默认用「万 / 亿」，与项目其它页面一致 */
export function formatCompactValue(value: number): string {
  if (!Number.isFinite(value)) return "-";

  const absolute = Math.abs(value);

  if (absolute >= 100_000_000) {
    return String(Number((value / 100_000_000).toFixed(2))) + "亿";
  }

  if (absolute >= 10_000) {
    return String(Number((value / 10_000).toFixed(2))) + "万";
  }

  if (absolute >= 1_000) return value.toLocaleString();
  if (Number.isInteger(value)) return String(value);

  return String(Number(value.toFixed(3)));
}