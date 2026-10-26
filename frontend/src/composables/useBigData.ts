import type { MaybeRefOrGetter } from "vue";
import { computed, shallowRef, toValue } from "vue";
import type { SampleMode } from "@/utils/sampling";

/**
 * 大数据处理管线（图表组件共用）
 *
 * 设计要点：
 * - 管线本身与图表类型无关：数据形状 T 由各图表自己决定（折线帧 / 散点对 / 热力格）
 * - 处理步骤是可注入的「阶段」（BigDataStage），新能力靠 registerStage 加，
 *   不用改图表组件；组件默认只挂与自身数据形状匹配的采样阶段
 * - 目标点数通常由容器像素宽度推导（见 resolveTargetPoints）：
 *   10 万级数据在渲染端只保留「容器宽度 × 像素密度」级别的点
 */

export interface BigDataContext {
  /** 目标渲染点数 */
  target: number;
  mode: SampleMode;
  /** 进入管线的原始点数 */
  raw: number;
  isLarge: boolean;
}

export interface BigDataStage<T> {
  /** 阶段名，重复注册会覆盖同名阶段 */
  name: string;
  /** 数据量未超过阈值时是否仍然执行，默认 false */
  always?: boolean;
  run: (data: T, context: BigDataContext) => T;
}

export interface BigDataStats {
  raw: number;
  processed: number;
  sampled: boolean;
  /** raw / processed */
  ratio: number;
  target: number;
  mode: SampleMode;
  stages: string[];
  isLarge: boolean;
}

export const DEFAULT_LARGE_THRESHOLD = 5_000;

/** 目标点数下限：再窄的容器也保留足够趋势 */
export const MIN_TARGET_POINTS = 800;

/** 目标点数上限：避免宽屏下点过多 */
export const MAX_TARGET_POINTS = 20_000;

/** 每 2 个设备像素保留 1 个点 */
export const POINTS_PER_PIXEL = 0.5;

/** 目标点数按该步长取整，避免 resize 时频繁重算 */
export const TARGET_STEP = 50;

/** 由容器像素宽度 + 设备像素比推导目标点数 */
export function resolveTargetPoints(width: number, dpr = 1): number {
  const pixels = Math.max(width, MIN_TARGET_POINTS) * dpr * POINTS_PER_PIXEL;
  const rounded = Math.round(pixels / TARGET_STEP) * TARGET_STEP;

  return Math.min(Math.max(rounded, MIN_TARGET_POINTS), MAX_TARGET_POINTS);
}

/** 默认数据量度量：数组看 length，图表帧看 xLabels.length */
function defaultSizeOf(data: unknown): number {
  if (Array.isArray(data)) return data.length;

  if (data && typeof data === "object" && "xLabels" in data) {
    const labels = (data as { xLabels?: unknown }).xLabels;

    return Array.isArray(labels) ? labels.length : 0;
  }

  return 0;
}

export interface UseBigDataOptions<T> {
  data: MaybeRefOrGetter<T>;
  /** 目标渲染点数，通常由容器像素宽度推导 */
  target: MaybeRefOrGetter<number>;
  mode?: MaybeRefOrGetter<SampleMode>;
  threshold?: MaybeRefOrGetter<number>;
  /** 数据量度量，默认自动识别数组 / 数据帧 */
  sizeOf?: (data: T) => number;
  /** 处理阶段（功能注入），按数组顺序执行 */
  stages?: BigDataStage<T>[];
}

export function useBigData<T>(options: UseBigDataOptions<T>) {
  const sizeOf = options.sizeOf ?? (defaultSizeOf as (data: T) => number);

  const rawData = computed(() => toValue(options.data));
  const raw = computed(() => sizeOf(rawData.value));
  const target = computed(() =>
    Math.max(2, Math.floor(toValue(options.target))),
  );
  const mode = computed<SampleMode>(() =>
    options.mode ? toValue(options.mode) : "lttb",
  );
  const threshold = computed(() =>
    options.threshold === undefined
      ? DEFAULT_LARGE_THRESHOLD
      : toValue(options.threshold),
  );
  const isLarge = computed(() => raw.value > threshold.value);

  /** 阶段列表用 shallowRef 持有，运行时增删不会触发深度遍历 */
  const stages = shallowRef<BigDataStage<T>[]>(options.stages ?? []);

  const context = computed<BigDataContext>(() => ({
    target: target.value,
    mode: mode.value,
    raw: raw.value,
    isLarge: isLarge.value,
  }));

  const data = computed<T>(() => {
    const ctx = context.value;
    let current = rawData.value;

    for (const stage of stages.value) {
      if (!stage.always && !ctx.isLarge) continue;

      current = stage.run(current, ctx);
    }

    return current;
  });

  const stats = computed<BigDataStats>(() => {
    const processed = sizeOf(data.value);

    return {
      raw: raw.value,
      processed,
      sampled: processed < raw.value,
      ratio: processed > 0 ? raw.value / processed : 1,
      target: target.value,
      mode: mode.value,
      stages: stages.value.map((stage) => stage.name),
      isLarge: isLarge.value,
    };
  });

  /** 注入阶段（同名覆盖，追加到末尾，因此同名阶段可替换默认实现） */
  function registerStage(stage: BigDataStage<T>): void {
    stages.value = [
      ...stages.value.filter((item) => item.name !== stage.name),
      stage,
    ];
  }

  function unregisterStage(name: string): void {
    stages.value = stages.value.filter((stage) => stage.name !== name);
  }

  return {
    data,
    rawData,
    stats,
    isLarge,
    stages,
    registerStage,
    unregisterStage,
  };
}
