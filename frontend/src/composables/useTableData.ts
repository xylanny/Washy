import type { MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";
import { storeToRefs } from "pinia";
import { useTableStore } from "@/stores/table";
import { buildFrame, probeFields } from "@/utils/chartFrame";
import type { ChartField, ChartFrame } from "@/utils/chartFrame";

/**
 * 图表页面的数据来源约定：统一读取 table Pinia store
 *
 * 面板只负责「选列」，这里负责「取数」：
 * - 类目列 = 页面上 X 轴选的 data 字段
 * - 数值系列 = 用户逐条添加的 series.data 字段
 * 各图表页面（Line / Bar / Pie …）都从这里取数，绘图组件只接收成品数据
 */

export interface UseTableChartDataOptions {
  /**
   * 类目列字段名，对应 category 轴的 data
   * 传空串表示还没选，此时帧里只有行号标签
   */
  labelField?: MaybeRefOrGetter<string>;
  /** 各条系列要画的数值列，顺序即系列顺序 */
  seriesFields?: MaybeRefOrGetter<string[]>;
}

const EMPTY_FRAME: ChartFrame = { xLabels: [], series: [] };

export function useTableChartData(options: UseTableChartDataOptions = {}) {
  const tableStore = useTableStore();
  const { table } = storeToRefs(tableStore);

  const hasTable = computed(() => Boolean(table.value));
  const rowCount = computed(() => table.value?.rows.length ?? 0);
  const fileName = computed(() => table.value?.fileName ?? "");

  const fields = computed<ChartField[]>(() =>
    table.value ? probeFields(table.value.headers, table.value.rows) : [],
  );

  const numericFields = computed(() =>
    fields.value.filter((field) => field.numeric),
  );

  /** 类目列由页面（xAxis.data）决定，不做任何自动预选 */
  const labelField = computed(() => toValue(options.labelField ?? "").trim());

  const hasLabel = computed(() => Boolean(labelField.value));

  /** 只保留仍然存在、且不是类目列的数值列，重复列只画一条 */
  const yFields = computed<string[]>(() => {
    const label = labelField.value;
    const available = new Set(numericFields.value.map((field) => field.value));
    const picked: string[] = [];

    for (const field of toValue(options.seriesFields ?? [])) {
      if (!available.has(field) || field === label) continue;
      if (picked.includes(field)) continue;
      picked.push(field);
    }

    return picked;
  });

  /** 交给图表组件的成品数据：类目标签 + 若干数值序列 */
  const frame = computed<ChartFrame>(() => {
    const current = table.value;
    const ys = yFields.value;

    if (!current || ys.length === 0) return EMPTY_FRAME;

    return buildFrame(current.rows, labelField.value, ys);
  });

  return {
    table,
    hasTable,
    rowCount,
    fileName,
    fields,
    numericFields,
    labelField,
    hasLabel,
    yFields,
    frame,
  };
}
