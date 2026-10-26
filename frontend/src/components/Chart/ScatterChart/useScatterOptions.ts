import { isArray, isNumber, isString } from "@/utils/judge";
import { formatCompactValue } from "@/utils/format";
import type { ChartOption } from "../types";
import type { ScatterChartProps, ScatterPointValue } from "./types";
import {
  LEGEND_BOTTOM_SPACE,
  LEGEND_SIDE_SPACE,
  isLegendAtBottom,
  isLegendAtSide,
  isLegendAtTop,
  placeLegend,
} from "../legend";

type OptionDataValue = string | number | Date | null | undefined;

type ScatterSymbolParams = {
  value?: OptionDataValue | OptionDataValue[];
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

function normalizePoint(point: ScatterPointValue): number[] | null {
  const [x, y, size] = point;

  const nx = toNumeric(x);
  const ny = toNumeric(y);

  if (!Number.isFinite(nx) || !Number.isFinite(ny)) return null;

  if (size === undefined) return [nx, ny];

  const ns = toNumeric(size);

  return Number.isFinite(ns) ? [nx, ny, ns] : [nx, ny];
}

function collectSizeRange(props: ScatterChartProps): [number, number] {
  if (!props.sizeField) return [0, 0];

  const sizes: number[] = [];

  for (const series of props.series) {
    for (const item of series.data) {
      const [, , size] = item.value;

      if (size === undefined) continue;

      const n = toNumeric(size);

      if (Number.isFinite(n)) sizes.push(n);
    }
  }

  if (!sizes.length) return [0, 0];

  return [Math.min(...sizes), Math.max(...sizes)];
}

export function buildScatterOption(props: ScatterChartProps): ChartOption {
  const withUnit = (text: string) =>
    props.valueUnit ? `${text}${props.valueUnit}` : text;

  const tooltipValueFormatter = (
    value: OptionDataValue | OptionDataValue[],
  ): string => {
    if (isArray(value)) {
      return value
        .map((v) => withUnit(formatCompactValue(toNumeric(v))))
        .join(", ");
    }

    return withUnit(formatCompactValue(toNumeric(value)));
  };

  const axisValueFormatter = (value: number): string =>
    withUnit(formatCompactValue(value));

  const [sizeMin, sizeMax] = collectSizeRange(props);
  const [symbolMin, symbolMax] = props.symbolSizeRange ?? [6, 40];
  const sizeSpan = sizeMax - sizeMin || 1;

  const symbolSize = props.sizeField
    ? (params: ScatterSymbolParams): number => {
        const raw = params.value;

        if (!isArray(raw) || raw.length < 3) return symbolMin;

        const size = toNumeric(raw[2]);

        if (!Number.isFinite(size)) return symbolMin;

        const ratio = (size - sizeMin) / sizeSpan;

        return symbolMin + ratio * (symbolMax - symbolMin);
      }
    : undefined;

  const series = props.series.map((e) => ({
    type: "scatter" as const,
    name: e.name,
    data: e.data
      .map((item) => normalizePoint(item.value))
      .filter((v): v is number[] => v !== null),
    symbol: e.symbol ?? "circle",
    symbolSize: props.sizeField ? symbolSize : (e.symbolSize ?? 8),
    itemStyle: {
      ...(e.color ? { color: e.color } : {}),
      opacity: e.opacity ?? 0.7,
    },
    emphasis: { focus: "series" as const },
  }));

  const showLegend = props.showLegend ?? props.series.length > 1;
  const legendPosition = props.legendPosition ?? "top";
  const hasTitle = Boolean(props.title);

  const legendAtTop = showLegend && isLegendAtTop(legendPosition);
  const legendAtBottom = showLegend && isLegendAtBottom(legendPosition);
  const legendAtSide = showLegend && isLegendAtSide(legendPosition);

  const showGrid = props.showGrid !== false;

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
      trigger: "item",
      valueFormatter: tooltipValueFormatter,
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
      type: "value",
      name: props.xName,
      nameLocation: "middle",
      nameGap: 28,
      splitLine: { show: showGrid },
      axisLabel: { formatter: axisValueFormatter },
      scale: true,
    },
    yAxis: {
      type: "value",
      name: props.yName,
      nameLocation: "middle",
      nameGap: 44,
      splitLine: { show: showGrid },
      axisLabel: { formatter: axisValueFormatter },
      scale: true,
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
