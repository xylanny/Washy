import { isNumber, isString } from "@/utils/judge";
import { toValue, type MaybeRefOrGetter } from "vue";

/**
 * 各分组字段组件共用的取值工具
 *
 * 传入 getter 而不是对象本身：配置对象被整体替换（例如 Reset）后，
 * 这里读到的仍然是当前 props 上的那一份。
 */
export function useFieldValue(
  model: MaybeRefOrGetter<Record<string, unknown>>,
) {
  function read(key: string): unknown {
    return toValue(model)[key];
  }

  function asString(key: string): string {
    const value = read(key);

    if (isString(value)) return value;

    if (isNumber(value)) return String(value);

    return "";
  }

  function asNumber(key: string): number | undefined {
    const value = read(key);

    if (isNumber(value)) return value;

    if (isString(value) && value.trim() !== "") {
      const parsed = Number(value);

      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  }

  function asBoolean(key: string): boolean {
    return read(key) === true;
  }

  function asSelect(key: string): string | number | undefined {
    const value = read(key);

    return isString(value) || isNumber(value) ? value : undefined;
  }

  return { asString, asNumber, asBoolean, asSelect };
}
