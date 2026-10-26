import { isArray, isNumber, isString } from "@/utils/judge";
import { formatCompactValue } from "@/utils/format";
import type { ChartOption } from "../types";
import type { HeatmapChartProps, HeatmapPoint } from "./types";

type OptionDataValue = string | number | Date | null | undefined;

function readValue(params: unknown): unknown {
  if (isArray(params)) {
    const first = params[0];

    if (first && typeof first === "object" && "value" in first) {
      return (first as { value?: unknown }).value;
    }

    return undefined;
  }

  if (params && typeof params === "object" && "value" in params) {
    return (params as { value?: unknown }).value;
  }

  return undefined;
}

function toNumeric(value: OptionDataValue | OptionDataValue[]): number {
  if (isArray(value)) {
    return toNumeric(value[value.length - 1]);
  }

  if (isNumber(value)) return value;

  if (isString(value)) return Number(value);

  if (value instanceof Date) return value.getTime();

  return Number.NaN;
}

function readPoint(
  value: unknown,
): { xIndex: number; yIndex: number; v: number } | null {
  if (!isArray(value) || value.length < 3) return null;

  const xIndex = toNumeric(value[0] as OptionDataValue);
  const yIndex = toNumeric(value[1] as OptionDataValue);
  const v = toNumeric(value[2] as OptionDataValue);

  if (
    !Number.isFinite(xIndex) ||
    !Number.isFinite(yIndex) ||
    !Number.isFinite(v)
  ) {
    return null;
  }

  return { xIndex, yIndex, v };
}

function normalizeData(data: HeatmapPoint[]): {
  points: number[][];
  min: number;
  max: number;
} {
  const points: number[][] = [];
  let min = Infinity;
  let max = -Infinity;

  for (const item of data) {
    if (!isArray(item) || item.length < 3) continue;

    const x = toNumeric(item[0]);
    const y = toNumeric(item[1]);
    const v = toNumeric(item[2]);

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(v)) {
      continue;
    }

    points.push([x, y, v]);

    if (v < min) min = v;
    if (v > max) max = v;
  }

  if (!points.length) return { points: [], min: 0, max: 1 };

  if (min === max) {
    return { points, min, max: min + 1 };
  }

  return { points, min, max };
}

const DEFAULT_COLORS = [
  "#313695",
  "#4575b4",
  "#74add1",
  "#abd9e9",
  "#e0f3f8",
  "#ffffbf",
  "#fee090",
  "#fdae61",
  "#f46d43",
  "#d73027",
  "#a50026",
];

export function buildHeatmapOption(props: HeatmapChartProps): ChartOption {
  const { points, min, max } = normalizeData(props.data);

  const withUnit = (text: string) =>
    props.valueUnit ? `${text}${props.valueUnit}` : text;

  // tooltip 参数可能是对象或数组，用 unknown 接收
  const tooltipFormatter = (params: unknown): string => {
    const point = readPoint(readValue(params));

    if (!point) return "";

    const xName = props.xCategories[point.xIndex] ?? String(point.xIndex);
    const yName = props.yCategories[point.yIndex] ?? String(point.yIndex);

    return `${xName} / ${yName}<br/>${withUnit(formatCompactValue(point.v))}`;
  };

  // label 参数是单个对象，同样用 unknown 接收
  const labelFormatter = (params: unknown): string => {
    const point = readPoint(readValue(params));

    return point ? formatCompactValue(point.v) : "";
  };

  return {
    title: props.title ? { text: props.title, left: "center" } : undefined,
    tooltip: {
      position: "top",
      formatter: tooltipFormatter,
    },
    grid: {
      left: 64,
      right: 24,
      top: props.title ? 64 : 40,
      bottom: 80,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: props.xCategories,
      splitArea: { show: true },
      axisLabel: {
        interval: 0,
        rotate: props.xCategories.length > 12 ? 45 : 0,
      },
    },
    yAxis: {
      type: "category",
      data: props.yCategories,
      splitArea: { show: true },
    },
    visualMap:
      props.showVisualMap !== false
        ? {
            min,
            max,
            calculable: true,
            orient: "horizontal",
            left: "center",
            bottom: 8,
            itemWidth: 16,
            itemHeight: 120,
            inRange: {
              color: props.colorRange ?? DEFAULT_COLORS,
            },
          }
        : undefined,
    series: [
      {
        type: "heatmap" as const,
        data: points,
        label: {
          show:
            props.showLabels ??
            (props.xCategories.length <= 12 && props.yCategories.length <= 12),
          formatter: labelFormatter,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };
}
