import { isArray, isNumber, isString } from "@/utils/judge";
import type { ChartOption } from "../types";
import type { LineChartProps, LineStep } from "./types";
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

export function buildLineOption(props: LineChartProps): ChartOption {
  const axisInterval = Math.max(0, Math.ceil(props.categories.length / 12) - 1);

  const withUnit = (text: string) =>
    props.valueUnit ? `${text}${props.valueUnit}` : text;

  const tooltipValueFormatter = (
    value: OptionDataValue | OptionDataValue[],
  ): string => withUnit(formatCompactValue(toNumeric(value)));

  const axisValueFormatter = (value: number): string =>
    withUnit(formatCompactValue(value));

  const smooth = props.smooth ?? true;
  const step = props.step;
  /** 阶梯折线与平滑曲线互斥，这里显式收窄成 ECharts 的取值 */
  const stepOption: false | LineStep = step ?? false;
  const area = props.area ?? false;
  const areaOpacity = (props.areaOpacity ?? 60) / 100;
  const lineWidth = props.lineWidth ?? 2;
  const lineDash = props.lineDash ?? "solid";
  const symbol = props.symbol ?? "emptyCircle";
  const symbolSize = props.symbolSize ?? 6;

  /** 数据点上是否显示数值 */
  const label = props.showValues
    ? {
        show: true,
        position: "top" as const,
        fontSize: 10,
        formatter: (params: unknown): string =>
          withUnit(formatCompactValue(toNumeric(readParamValue(params)))),
      }
    : undefined;

  const series = props.series.map((e) => ({
    type: "line" as const,
    name: e.name,
    data: e.data.map((p) => toNumeric(p.value)),
    // 阶梯折线与平滑曲线互斥
    smooth: step ? false : (e.smooth ?? smooth),
    step: stepOption,
    areaStyle: (e.area ?? area) ? { opacity: areaOpacity } : undefined,
    stack: e.stack,
    symbol,
    symbolSize,
    label,
    itemStyle: e.color ? { color: e.color } : undefined,
    lineStyle: {
      width: lineWidth,
      type: lineDash,
      ...(e.color ? { color: e.color } : {}),
    },
    emphasis: { focus: "series" as const },
  }));

  const showLegend = props.showLegend ?? props.series.length > 1;
  const legendPosition = props.legendPosition ?? "top";
  const hasTitle = Boolean(props.title);

  const legendAtTop = showLegend && isLegendAtTop(legendPosition);
  const legendAtBottom = showLegend && isLegendAtBottom(legendPosition);
  const legendAtSide = showLegend && isLegendAtSide(legendPosition);

  /** 底部图例要给 dataZoom 滑块让位 */
  const legendBottomOffset = props.dataZoom ? 30 : 8;

  /** 标题与图例各占一行：标题在最上，图例紧随其后，避免两者叠在一起 */
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
          bottom: legendBottomOffset,
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
      axisPointer: { type: "cross" },
    },
    legend,
    grid: {
      left: gridLeft,
      right: gridRight,
      top: gridTop,
      bottom: gridBottom,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: props.categories,
      boundaryGap: false,
      axisLabel: {
        interval: axisInterval,
        hideOverlap: true,
        rotate: props.xLabelRotate ?? 0,
      },
    },
    yAxis: {
      type: "value",
      scale: props.yScale === true,
      splitLine: { show: props.showGridY !== false },
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
