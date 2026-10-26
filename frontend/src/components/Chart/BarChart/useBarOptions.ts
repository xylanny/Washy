import { isArray, isNumber, isString } from "@/utils/judge";
import type { ChartOption } from "../types";
import type { BarChartProps } from "./types";
import { formatCompactValue } from "@/utils/format";
import {
  LEGEND_BOTTOM_SPACE,
  LEGEND_SIDE_SPACE,
  isLegendAtBottom,
  isLegendAtSide,
  isLegendAtTop,
  placeLegend,
} from "../legend";

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

/** ECharts 回调参数里取出数值 */
function readParamValue(params: unknown): OptionDataValue {
  if (params && typeof params === "object" && "value" in params) {
    return (params as { value?: OptionDataValue }).value;
  }

  return undefined;
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

  /** 柱子上是否显示数值 */
  const label = props.showValues
    ? {
        show: true,
        position: horizontal ? ("right" as const) : ("top" as const),
        fontSize: 10,
        formatter: (params: unknown): string =>
          withUnit(formatCompactValue(toNumeric(readParamValue(params)))),
      }
    : undefined;

  const categoryAxis = {
    type: "category" as const,
    data: props.categories,
    axisLabel: {
      interval: axisInterval,
      hideOverlap: true,
      rotate: horizontal ? 0 : (props.xLabelRotate ?? 0),
    },
  };

  const valueAxis = {
    type: "value" as const,
    scale: props.yScale === true,
    splitLine: { show: props.showGridY !== false },
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
      label,
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
  const legendPosition = props.legendPosition ?? "top";
  const hasTitle = Boolean(props.title);

  const legendAtTop = showLegend && isLegendAtTop(legendPosition);
  const legendAtBottom = showLegend && isLegendAtBottom(legendPosition);
  const legendAtSide = showLegend && isLegendAtSide(legendPosition);

  /** 标题与图例各占一行，避免叠在一起 */
  const title = hasTitle
    ? {
        text: props.title,
        left: "center" as const,
        top: 10,
        textStyle: { fontSize: 14, fontWeight: 600 as const },
      }
    : undefined;

  const legend = showLegend
    ? {
        ...placeLegend(legendPosition, {
          top: hasTitle ? 34 : 8,
          bottom: props.dataZoom ? 30 : 8,
        }),
        type: "scroll" as const,
      }
    : undefined;

  const gridTop = hasTitle
    ? legendAtTop
      ? 66
      : 48
    : legendAtTop
      ? 40
      : 24;

  const gridLeft =
    48 + (legendAtSide && legendPosition === "left" ? LEGEND_SIDE_SPACE : 0);

  const gridRight =
    24 + (legendAtSide && legendPosition === "right" ? LEGEND_SIDE_SPACE : 0);

  const gridBottom =
    (props.dataZoom ? 56 : 48) + (legendAtBottom ? LEGEND_BOTTOM_SPACE : 0);

  return {
    title,
    tooltip: {
      trigger: "axis",
      valueFormatter: tooltipValueFormatter,
      axisPointer: { type: "shadow" },
    },
    legend,
    grid: {
      left: gridLeft,
      right: gridRight,
      top: gridTop,
      bottom: gridBottom,
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
