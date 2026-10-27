/**
 * 图表降采样
 *
 * 大数据量下渲染端只需要「容器像素宽度 × 像素密度」级别的点，
 * 这里提供三种互有取舍的采样方式，交给 useBigData 的阶段按图表类型挑选：
 * - lttb：保留趋势与峰谷（默认，视觉误差最小）
 * - average：按桶取均值，适合噪声大的序列
 * - min-max：按桶保留最小 / 最大点，保证极值不被抹平
 */

/** 采样模式 */
export type SampleMode = "none" | "lttb" | "average" | "min-max";

/** 采样输入的统一形状：x 通常是索引或时间，y 是数值 */
export interface SamplePoint {
  x: number;
  y: number;
}

/** 采样后点数下限：低于该值直接返回原数据 */
export const MIN_SAMPLE_TARGET = 3;

/** 桶大小：保证每个桶至少能取到一个点 */
function bucketRange(
  length: number,
  index: number,
  size: number,
): [number, number] {
  const start = Math.floor(index * size);

  return [start, Math.min(Math.floor((index + 1) * size), length)];
}

/** 按桶取均值 */
export function sampleAverage(
  points: SamplePoint[],
  target: number,
): SamplePoint[] {
  const length = points.length;

  if (target >= length || target < MIN_SAMPLE_TARGET) return points.slice();

  const result: SamplePoint[] = [];
  const size = length / target;

  for (let i = 0; i < target; i += 1) {
    const [start, end] = bucketRange(length, i, size);
    let sumX = 0;
    let sumY = 0;
    const count = end - start;

    for (let j = start; j < end; j += 1) {
      sumX += points[j].x;
      sumY += points[j].y;
    }

    result.push(
      count > 0
        ? { x: sumX / count, y: sumY / count }
        : points[Math.min(start, length - 1)],
    );
  }

  return result;
}

/** 按桶保留最小 / 最大点，极值不会丢 */
export function sampleMinMax(
  points: SamplePoint[],
  target: number,
): SamplePoint[] {
  const length = points.length;

  if (target >= length || target < MIN_SAMPLE_TARGET) return points.slice();

  // 每桶出两个点，因此桶数是目标点数的一半
  const buckets = Math.max(2, Math.floor(target / 2));
  const size = length / buckets;
  const result: SamplePoint[] = [];

  for (let i = 0; i < buckets; i += 1) {
    const [start, end] = bucketRange(length, i, size);

    if (end <= start) continue;

    let min = points[start];
    let max = points[start];

    for (let j = start; j < end; j += 1) {
      const point = points[j];

      if (point.y < min.y) min = point;
      if (point.y > max.y) max = point;
    }

    // 保持原始顺序，避免折线来回穿插
    if (min.x <= max.x) result.push(min, max);
    else result.push(max, min);
  }

  return result;
}

/**
 * Largest-Triangle-Three-Buckets
 *
 * 对每个桶取「与前后相邻桶平均点构成三角形面积最大」的点，
 * 相比等距抽样更不容易抹掉峰谷。
 */
export function sampleLttb(
  points: SamplePoint[],
  target: number,
): SamplePoint[] {
  const length = points.length;

  if (target >= length || target < MIN_SAMPLE_TARGET) return points.slice();

  const result: SamplePoint[] = [points[0]];
  // 首尾固定保留，中间的 (target - 2) 个点从 (length - 2) 个点里挑
  const every = (length - 2) / (target - 2);
  let anchor = 0;

  for (let i = 0; i < target - 2; i += 1) {
    const start = Math.floor((i + 1) * every) + 1;
    const end = Math.min(Math.floor((i + 2) * every) + 1, length - 1);

    // 下一个桶的平均点，作为三角形的第三个顶点
    const nextStart = end;
    const nextEnd = Math.max(
      Math.min(Math.floor((i + 3) * every) + 1, length),
      nextStart + 1,
    );
    let avgX = 0;
    let avgY = 0;
    const nextCount = nextEnd - nextStart;

    for (let j = nextStart; j < nextEnd; j += 1) {
      avgX += points[j].x;
      avgY += points[j].y;
    }

    avgX /= nextCount;
    avgY /= nextCount;

    const baseX = points[anchor].x;
    const baseY = points[anchor].y;
    let maxArea = -1;
    let picked = Math.min(start, length - 1);

    for (let j = start; j < end; j += 1) {
      const point = points[j];
      const area = Math.abs(
        (baseX - avgX) * (point.y - baseY) -
          (baseX - point.x) * (avgY - baseY),
      );

      if (area > maxArea) {
        maxArea = area;
        picked = j;
      }
    }

    result.push(points[picked]);
    anchor = picked;
  }

  result.push(points[length - 1]);

  return result;
}

/** 按模式采样，未知模式按不采样处理 */
export function samplePoints(
  points: SamplePoint[],
  target: number,
  mode: SampleMode = "lttb",
): SamplePoint[] {
  switch (mode) {
    case "average":
      return sampleAverage(points, target);
    case "min-max":
      return sampleMinMax(points, target);
    case "lttb":
      return sampleLttb(points, target);
    default:
      return points.slice();
  }
}
