import type { TableRow } from "@/types";
import { isNumber, isString } from "@/utils/judge";

/** 判断一列能否当作数值列时最多抽查的行数 */
export const FIELD_SAMPLE_ROWS = 100;

/** 一列的探测结果 */
export interface ChartField {
  /** 列名 */
  value: string;
  /** 是否可以作为数值列使用 */
  numeric: boolean;
  /** 抽样中能解析成数字的行数 */
  numericCount: number;
  /** 抽样中的空值行数 */
  emptyCount: number;
}

/** 数据帧里的一条数值序列 */
export interface ChartFrameSeries {
  name: string;
  data: Array<number | null>;
}

/** 交给图表组件的成品数据：类目标签 + 若干数值序列 */
export interface ChartFrame {
  xLabels: string[];
  series: ChartFrameSeries[];
}

/** 表格单元格 → 数字（兼容 1,234 / ¥1,200 / 12% 这类写法） */
export function toNumericValue(value: unknown): number | null {
  if (isNumber(value)) {
    return Number.isFinite(value) ? value : null;
  }

  if (!isString(value)) return null;

  const text = value.trim();

  if (!text) return null;

  const direct = Number(text);

  if (Number.isFinite(direct)) return direct;

  const cleaned = text.replace(/[\s,，]/g, "").replace(/[¥$€£%]/g, "");

  if (!cleaned || cleaned === "-") return null;

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

/** 探测每一列能否当作数值列（只抽样前若干行，避免大表全量扫描） */
export function probeFields(headers: string[], rows: TableRow[]): ChartField[] {
  const limit = Math.min(rows.length, FIELD_SAMPLE_ROWS);

  return headers.map((header) => {
    let numericCount = 0;
    let emptyCount = 0;

    for (let i = 0; i < limit; i += 1) {
      const cell = rows[i][header];

      if (toNumericValue(cell) !== null) {
        numericCount += 1;
      } else if (cell === null || cell === undefined || cell === "") {
        emptyCount += 1;
      }
    }

    return {
      value: header,
      numeric: numericCount > 0,
      numericCount,
      emptyCount,
    };
  });
}

/**
 * 按「类目列 + 数值列」组装数据帧
 *
 * - labelField 为空时用行号当类目标签
 * - 解析不出的单元格留 null，交给 ECharts 断线处理
 */
export function buildFrame(
  rows: TableRow[],
  labelField: string,
  seriesFields: string[],
): ChartFrame {
  const xLabels = rows.map((row, index) =>
    labelField ? String(row[labelField] ?? "") : String(index + 1),
  );

  const series = seriesFields.map((field) => ({
    name: field,
    data: rows.map((row) => toNumericValue(row[field])),
  }));

  return { xLabels, series };
}
