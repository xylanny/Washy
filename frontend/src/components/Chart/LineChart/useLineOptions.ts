import { isArray, isNumber, isString } from "@/utils/judge";
import type { ChartOption } from "../types";
import type { LineChartProps } from "./types";
import { formatCompactValue } from "@/utils/format";

type OptionDataValue = string | number | Date | null | undefined;

function toNumeric(value: OptionDataValue | OptionDataValue[]): number {
  if (isArray(value)) {
    return toNumeric(value[value.length - 1]);
  }

  if (isNumber(value)) return value;

  if (isString(value)) return Number(value);

  if (value instanceof Date) return value.getTime();

  return Number.NaN;
}

export function buildLineOption(props: LineChartProps): ChartOption {
  const axisInterval = Math.max(0, Math.ceil(props.categories.length / 12) - 1);

  const withUnit = (text: string) =>
    props.valueUnit ? `${text}${props.valueUnit}` : text;

  const tooltipValueFormatter = (
    value: OptionDataValue | OptionDataValue[],
  ): string => withUnit(formatCompactValue(toNumeric(value)));

  const axisValueFormatter = (value: number): string =>
    withUnit(formatCompactValue(value));

  const series = props.series.map((e) => ({
    type: "line" as const,
    name: e.name,
    data: e.data.map((p) => toNumeric(p.value)),
    smooth: e.smooth ?? true,
    areaStyle: e.area ? {} : undefined,
    stack: e.stack,
    itemStyle: e.color ? { color: e.color } : undefined,
    lineStyle: e.color ? { color: e.color } : undefined,
    emphasis: { focus: "series" as const },
  }));

  const showLegend = props.showLegend ?? props.series.length > 1;

  return {
    title: props.title ? { text: props.title, left: "center" } : undefined,
    tooltip: {
      trigger: "axis",
      valueFormatter: tooltipValueFormatter,
      axisPointer: { type: "cross" },
    },
    legend: showLegend ? { top: 8, type: "scroll" } : undefined,
    grid: {
      left: 48,
      right: 24,
      top: props.title ? 56 : 32,
      bottom: props.dataZoom ? 56 : 48,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: props.categories,
      boundaryGap: false,
      axisLabel: { interval: axisInterval, hideOverlap: true },
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: axisValueFormatter },
    },
    dataZoom:
      props.dataZoom === true
        ? [
            { type: "inside", start: 0, end: 100 },
            { type: "slider", height: 18, bottom: 8 },
          ]
        : undefined,
    series,
  };
}
