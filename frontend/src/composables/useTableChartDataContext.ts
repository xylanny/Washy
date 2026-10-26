import type { InjectionKey } from "vue";
import { inject, provide } from "vue";
import { useTableChartData } from "@/composables/useTableData";
import type { UseTableChartDataOptions } from "@/composables/useTableData";

/**
 * 图表页共享的数据上下文
 * 页面创建一次（provide），舞台取数、面板选列都从这里拿，保证同一份选择状态
 */
export type TableChartDataContext = ReturnType<typeof useTableChartData>;

const TABLE_CHART_DATA_KEY: InjectionKey<TableChartDataContext> = Symbol(
  "tableChartData",
);

export function provideTableChartData(
  options: UseTableChartDataOptions = {},
): TableChartDataContext {
  const context = useTableChartData(options);

  provide(TABLE_CHART_DATA_KEY, context);

  return context;
}

export function useTableChartDataContext(): TableChartDataContext {
  const context = inject(TABLE_CHART_DATA_KEY, undefined);

  if (!context) {
    throw new Error(
      "TableChartData context is missing: call provideTableChartData() in the page component",
    );
  }

  return context;
}
