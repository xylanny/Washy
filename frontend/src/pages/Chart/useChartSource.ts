import type { TableRow } from "@/types";
import type { ChartPanelOption } from "./ChartPanel/types";
import type { ChartSource } from "./types";
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useTableStore } from "@/stores/table";
import { isNumber, isString } from "@/utils/judge";
import { DEMO_SOURCE, MAX_POINTS, NUMERIC_SAMPLE_ROWS } from "./constants";

/** 表格里读出来的值可能是数字、数字字符串或空值 */
export function toNumber(value: unknown): number | null {
  if (isNumber(value)) {
    return Number.isFinite(value) ? value : null;
  }

  if (!isString(value)) return null;

  const text = value.trim();

  if (!text) return null;

  const direct = Number(text);

  if (Number.isFinite(direct)) return direct;

  // 兼容表格里常见的写法：1,234 / 1 234 / ¥1,200 / 12%
  const cleaned = text.replace(/[\s,，]/g, "").replace(/[¥$€£%]/g, "");

  if (!cleaned || cleaned === "-") return null;

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

/** 抽样判断一列能否当作数值轴使用 */
function isNumericColumn(rows: TableRow[], header: string): boolean {
  const limit = Math.min(rows.length, NUMERIC_SAMPLE_ROWS);

  for (let i = 0; i < limit; i += 1) {
    if (toNumber(rows[i][header]) !== null) return true;
  }

  return false;
}

/**
 * 图表页的数据源：优先取已打开的表格，没有表格时退回示例数据
 *
 * 各图表页只在「怎么用这些列」上有区别，取数逻辑都走这里。
 */
export function useChartSource() {
  const tableStore = useTableStore();
  const { table } = storeToRefs(tableStore);

  const source = computed<ChartSource>(() => {
    const current = table.value;

    if (current && current.headers.length && current.rows.length) {
      return {
        label: current.fileName ?? "Untitled table",
        headers: current.headers,
        valueHeaders: current.headers.filter((header) =>
          isNumericColumn(current.rows, header),
        ),
        rows: current.rows,
      };
    }

    return DEMO_SOURCE;
  });

  /** 画布只画前 MAX_POINTS 行 */
  const rows = computed(() => source.value.rows.slice(0, MAX_POINTS));

  /**
   * 可选的数值列
   *
   * 一列都没识别成数值时退回全部列：否则面板里连可选的列都没有，
   * 用户就没法添加系列 / 选数值轴了（具体数值在取数时再解析一次）。
   */
  const valueHeaders = computed<string[]>(() => {
    const numeric = source.value.valueHeaders;

    return numeric.length ? numeric : source.value.headers;
  });

  const categoryOptions = computed<ChartPanelOption[]>(() =>
    source.value.headers.map((header) => ({ label: header, value: header })),
  );

  const valueOptions = computed<ChartPanelOption[]>(() =>
    valueHeaders.value.map((header) => ({ label: header, value: header })),
  );

  return { source, rows, valueHeaders, categoryOptions, valueOptions };
}
