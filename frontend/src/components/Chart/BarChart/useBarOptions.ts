import { isArray, isNumber, isString } from "@/utils/judge";
import type { ChartOption } from "../types";
import type { BarChartProps } from "./types";
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

export function buildBarOption(props: BarChartProps): ChartOption {
  const axisInterval = Math.max(0, Math.ceil(props.categories.length / 12) - 1);

  const withUnit = (text: string) =>
    props.valueUnit ? `${text}${props.valueUnit}` : text;

  const tooltipValueFormatter = (
    value: OptionDataValue | OptionDataValue[],
  ): string => withUnit(formatCompactValue(toNumeric(value)));

  const axisValueFormatter = (value: number): string =>
    withUnit(formatCompactValue(value));

  // 水平柱状：数值轴在 x，类目轴在 y；垂直柱状反之
  const horizontal = props.series.some((s) => s.horizontal);

  const categoryAxis = {
    type: "category" as const,
    data: props.categories,
    axisLabel: { interval: axisInterval, hideOverlap: true },
  };

  const valueAxis = {
    type: "value" as const,
    axisLabel: { formatter: axisValueFormatter },
  };

  const series = props.series.map((e) => {
    const isHorizontal = e.horizontal ?? horizontal;

    return {
      type: "bar" as const,
      name: e.name,
      data: e.data.map((p) => toNumeric(p.value)),
      stack: e.stack,
      barWidth: e.barWidth,
      itemStyle: {
        ...(e.color ? { color: e.color } : {}),
        ...(e.borderRadius !== undefined
          ? { borderRadius: e.borderRadius }
          : {}),
      },
      emphasis: { focus: "series" as const },
      // 单个系列的 horizontal 会影响坐标轴，这里仅标记，坐标轴在下方统一决定
      _horizontal: isHorizontal,
    };
  });

  // 系列里 horizontal 混合场景较少，统一以第一个系列为准（或调用方保持全一致）
  const xAxis = horizontal ? valueAxis : categoryAxis;
  const yAxis = horizontal ? categoryAxis : valueAxis;

  // 去掉内部标记字段，避免透传给 ECharts
  const cleanSeries = series.map(({ _horizontal, ...rest }) => rest);

  const showLegend = props.showLegend ?? props.series.length > 1;

  return {
    title: props.title ? { text: props.title, left: "center" } : undefined,
    tooltip: {
      trigger: "axis",
      valueFormatter: tooltipValueFormatter,
      axisPointer: { type: horizontal ? "shadow" : "shadow" },
    },
    legend: showLegend ? { top: 8, type: "scroll" } : undefined,
    grid: {
      left: 48,
      right: 24,
      top: props.title ? 56 : 32,
      bottom: props.dataZoom ? 56 : 48,
      containLabel: true,
    },
    xAxis,
    yAxis,
    dataZoom:
      props.dataZoom === true
        ? [
            { type: "inside", start: 0, end: 100 },
            { type: "slider", height: 18, bottom: 8 },
          ]
        : undefined,
    series: cleanSeries,
  };
}
