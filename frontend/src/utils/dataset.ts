import type { Table, TableRow } from "@/types";
import * as XLSX from "xlsx";

/** 参与统计的最大行数，避免超大表把页面卡住 */
const MAX_STAT_ROWS = 20_000;

/** 示例数据行数 */
const MAX_SAMPLE_ROWS = 10;

/** 数据上下文的最大字符数（后端默认上限 12000） */
const MAX_SUMMARY_CHARS = 4000;

/** 判定为数值列的最少占比 */
const NUMERIC_RATIO = 0.6;

export interface DatasetDigest {
  fileName: string;
  rows: number;
  cols: number;
  /** 发给模型的数据上下文 */
  summary: string;
}

interface ColumnStats {
  header: string;
  type: "数值" | "日期" | "文本";
  empty: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  sum: number;
}

/** 读取 CSV / Excel 为表格（只读，不影响表格页当前打开的数据） */
export function parseDataFile(file: File): Promise<Table> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        let workbook: XLSX.WorkBook;

        if (file.name.toLowerCase().endsWith(".csv")) {
          workbook = XLSX.read(data as string, {
            type: "string",
            raw: true,
            codepage: 65001,
          });
        } else {
          workbook = XLSX.read(data as ArrayBuffer, {
            type: "array",
            raw: true,
            cellDates: true,
          });
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          reject(new Error("The file has no readable worksheet"));
          return;
        }

        const rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          raw: false,
        }) as TableRow[];

        if (rows.length === 0) {
          reject(new Error("The file has no data rows"));
          return;
        }

        resolve({
          headers: Object.keys(rows[0]),
          rows,
          fileName: file.name,
        });
      } catch {
        reject(new Error("Could not parse the file — CSV or Excel only"));
      }
    };

    reader.onerror = () => reject(new Error("Could not read the file"));

    if (file.name.toLowerCase().endsWith(".csv")) {
      reader.readAsText(file, "UTF-8");
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (Number.isInteger(value)) return value.toLocaleString("zh-CN");
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function toNumber(value: TableRow[string]): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const text = String(value ?? "").trim();
  if (text === "") return null;

  const parsed = Number(text.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function computeColumnStats(rows: TableRow[], header: string): ColumnStats {
  const limit = Math.min(rows.length, MAX_STAT_ROWS);

  let filled = 0;
  let empty = 0;
  let numericCount = 0;
  let dateCount = 0;

  const numbers: number[] = [];

  for (let index = 0; index < limit; index++) {
    const raw = rows[index]?.[header];
    const text = raw === null || raw === undefined ? "" : String(raw).trim();

    if (text === "") {
      empty++;
      continue;
    }

    filled++;
    const numeric = toNumber(raw);

    if (numeric !== null) {
      numericCount++;
      numbers.push(numeric);
    } else if (/^\d{4}[-/年]\d{1,2}([-/月]\d{1,2})?/.test(text)) {
      dateCount++;
    }
  }

  const type: ColumnStats["type"] =
    filled > 0 && numericCount / filled >= NUMERIC_RATIO
      ? "数值"
      : filled > 0 && dateCount / filled >= 0.5
        ? "日期"
        : "文本";

  const stats: ColumnStats = {
    header,
    type,
    empty,
    min: 0,
    max: 0,
    mean: 0,
    median: 0,
    sum: 0,
  };

  if (type === "数值" && numbers.length > 0) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    stats.min = sorted[0];
    stats.max = sorted[sorted.length - 1];
    stats.sum = sorted.reduce((total, value) => total + value, 0);
    stats.mean = stats.sum / sorted.length;
    stats.median =
      sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
  }

  return stats;
}

/**
 * 把表格压缩成一段人类可读、模型也能直接分析的上下文。
 *
 * 内容包含：文件信息、字段类型、示例数据（CSV）、数值列统计、缺失值。
 */
export function buildDatasetDigest(table: Table, fileName?: string): DatasetDigest {
  const name = fileName || table.fileName || "未命名数据表";
  const headers = table.headers;
  const rows = table.rows;
  const stats = headers.map((header) => computeColumnStats(rows, header));

  const lines: string[] = [];

  lines.push(`文件名：${name}`);
  lines.push(`规模：${rows.length} 行 × ${headers.length} 列`);
  lines.push(
    `字段：${stats.map((stat) => `${stat.header}(${stat.type})`).join("、")}`,
  );

  if (rows.length > MAX_SAMPLE_ROWS) {
    lines.push(
      `说明：以下是前 ${MAX_SAMPLE_ROWS} 行示例，完整数据共 ${rows.length} 行。`,
    );
  }

  const sample = rows
    .slice(0, MAX_SAMPLE_ROWS)
    .map((row) => headers.map((header) => csvCell(row[header])).join(","));

  lines.push("示例数据（CSV，首行为字段名）：");
  lines.push([headers.map((header) => csvCell(header)).join(","), ...sample].join("\n"));

  const numeric = stats.filter((stat) => stat.type === "数值");
  if (numeric.length > 0) {
    lines.push("数值字段统计（基于全部数据）：");
    for (const stat of numeric) {
      lines.push(
        `- ${stat.header}：最小 ${formatNumber(stat.min)}，最大 ${formatNumber(
          stat.max,
        )}，均值 ${formatNumber(stat.mean)}，中位数 ${formatNumber(
          stat.median,
        )}，合计 ${formatNumber(stat.sum)}`,
      );
    }
  }

  const empty = stats.filter((stat) => stat.empty > 0);
  if (empty.length > 0) {
    lines.push(
      `缺失值：${empty
        .map((stat) => `${stat.header} ${stat.empty} 个`)
        .join("、")}`,
    );
  }

  let summary = lines.join("\n");
  if (summary.length > MAX_SUMMARY_CHARS) {
    summary = `${summary.slice(0, MAX_SUMMARY_CHARS)}\n...（上下文过长，已截断）`;
  }

  return {
    fileName: name,
    rows: rows.length,
    cols: headers.length,
    summary,
  };
}
