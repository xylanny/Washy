import { isString } from "./judge";

export class WashyError extends Error {
  constructor(msg: string, name: string = "WashyError") {
    super(msg);
    this.name = name;
  }
}

/**
 * 抛出一定格式内容的异常
 *
 * @param scope 抛出异常的位置
 * @param msg 核心异常内容
 */
export function throwError(scope: string, msg: string): never {
  // 使用 never 作为返回值类型，表达“函数永不返回”
  throw new WashyError(`[${scope}] ${msg}`);
}

export function debugWarn(err: Error): void;
export function debugWarn(scope: string, msg: string): void;

/**
 * 在非生产环境下输出警告信息
 *
 * @param scope 错误发生的位置 或者 Error 对象
 * @param msg 核心错误信息
 */
export function debugWarn(scope: string | Error, msg?: string): void {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    const error: Error = isString(scope)
      ? new WashyError(`[${scope}] ${msg}`)
      : scope;

    console.warn(error);
  }
}
