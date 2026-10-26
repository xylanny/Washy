import { isArray, isNumber, isString } from "@/utils/judge";
import { formatCompactValue } from "@/utils/format";
import type { ChartOption } from "../types";
import type { PieChartProps } from "./types";

type OptionDataValue = string | number | Date | null | undefined;

type PieLabelParams = {
  name?: string;
  percent?: number;
  value?: unknown;
};

function toNumeric(value: OptionDataValue | OptionDataValue[]): number {
  if (isArray(value)) {
    return toNumeric(value[value.length - 1]);
  }

  if (isNumber(value)) return value;

  if (isString(value)) return Number(value);

  if (value instanceof Date) return value.getTime();

  return Number.NaN;
}

function normalizeData(
  data: PieChartProps["data"],
): { name: string; value: number }[] {
  const totals = new Map<string, number>();

  for (const item of data) {
    const value = toNumeric(item.value);

    if (!Number.isFinite(value)) continue;

    const name = String(item.name ?? "");

    totals.set(name, (totals.get(name) ?? 0) + value);
  }

  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

export function buildPieOption(props: PieChartProps): ChartOption {
  const data = normalizeData(props.data);

  const withUnit = (text: string) =>
    props.valueUnit ? `${text}${props.valueUnit}` : text;

  const tooltipValueFormatter = (
    value: OptionDataValue | OptionDataValue[],
  ): string => withUnit(formatCompactValue(toNumeric(value)));

  const radius: string | [string, string] = props.donut
    ? ["45%", "70%"]
    : (props.radius ?? "65%");

  const labelPosition = props.labelPosition ?? "outside";

  const labelType = props.labelType ?? "percent";

  /** 中间位置显示总量 */
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const showLegend = props.showLegend ?? true;

  const series = [
    {
      type: "pie" as const,
      radius,
      data,
      roseType: props.roseType,
      label: {
        show: true,
        position: labelPosition,
        formatter: (params: PieLabelParams) => {
          if (labelPosition === "center") {
            return withUnit(formatCompactValue(total));
          }

          const suffix =
            labelType === "value"
              ? withUnit(
                  formatCompactValue(toNumeric(params.value as OptionDataValue)),
                )
              : `${params.percent ?? 0}%`;

          return `${params.name ?? ""}\n${suffix}`;
        },
      },
      labelLine: {
        show: labelPosition === "outside",
        ...(labelPosition === "outside" ? { length: 12, length2: 8 } : {}),
      },
      itemStyle: { borderColor: "#fff", borderWidth: 1 },
      ...(labelPosition === "center"
        ? {
            emphasis: {
              label: { show: true, fontSize: 20, fontWeight: "bold" as const },
            },
          }
        : {}),
    },
  ];

  return {
    title: props.title ? { text: props.title, left: "center" } : undefined,
    tooltip: {
      trigger: "item",
      valueFormatter: tooltipValueFormatter,
    },
    legend: showLegend
      ? { top: 8, type: "scroll", orient: "horizontal" }
      : undefined,
    series,
  };
}
