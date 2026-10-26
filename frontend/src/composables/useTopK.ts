import type { ComputedRef, MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";

/**
 * 取前 K 项（雷达图指标过多时只保留最重要的几项）
 * - 默认按 getValue 降序取前 K，其余丢弃
 * - aggregate: true 时把其余项聚合成一个「其他」项返回
 */
export interface UseTopKOptions<T> {
  /** 保留项数，<= 0 或 >= 总数时全量返回 */
  limit: MaybeRefOrGetter<number>;
  /** 排序权重，越大越靠前 */
  getValue: (item: T) => number;
  /** 其余项是否聚合为「其他」 */
  aggregate?: boolean;
  othersLabel?: string;
  /** 聚合算法，默认求和 */
  reducer?: (items: T[]) => number;
}

export interface UseTopKResult<T> {
  /** 前 K 项（保持原数组相对顺序可选择，这里按权重降序） */
  top: ComputedRef<T[]>;
  /** 被裁掉的项 */
  rest: ComputedRef<T[]>;
  /** 原始项数 */
  total: ComputedRef<number>;
  /** 是否发生了裁剪 */
  truncated: ComputedRef<boolean>;
  /** 聚合后的「其他」项（aggregate 为 true 时存在） */
  others: ComputedRef<{ label: string; value: number } | null>;
}

export function useTopK<T>(
  items: MaybeRefOrGetter<readonly T[]>,
  options: UseTopKOptions<T>,
): UseTopKResult<T> {
  const source = computed(() => toValue(items) ?? []);
  const limit = computed(() => Math.floor(toValue(options.limit)));

  const sorted = computed(() =>
    [...source.value].sort(
      (a, b) => options.getValue(b) - options.getValue(a),
    ),
  );

  const top = computed(() => {
    const count = limit.value;

    if (!Number.isFinite(count) || count <= 0 || count >= sorted.value.length) {
      return sorted.value;
    }

    return sorted.value.slice(0, count);
  });

  const rest = computed(() => {
    if (top.value.length >= sorted.value.length) return [];

    return sorted.value.slice(top.value.length);
  });

  const total = computed(() => source.value.length);

  const truncated = computed(() => rest.value.length > 0);

  const others = computed(() => {
    if (!options.aggregate || rest.value.length === 0) return null;

    const reducer =
      options.reducer ??
      ((list: T[]) => list.reduce((sum, item) => sum + options.getValue(item), 0));

    return {
      label: options.othersLabel ?? "其他",
      value: reducer(rest.value),
    };
  });

  return { top, rest, total, truncated, others };
}
