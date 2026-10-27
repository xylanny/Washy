import type { ChartTheme, ChartThemeMode } from "@/components/Chart/types";

/** 读不到 CSS 变量时的兜底配色（与 vars.scss 的浅色主题一致） */
const LIGHT_FALLBACK = {
  textColor: "#2c2c2c",
  subTextColor: "#6b6b6b",
  axisLineColor: "oklch(63.219% 0.00701 255.662)",
  splitLineColor: "oklch(75.552% 0.00853 254.049)",
  tooltipBackgroundColor: "#ffffff",
  tooltipTextColor: "#2c2c2c",
};

/** 读不到 CSS 变量时的兜底配色（与 vars.scss 的深色主题一致） */
const DARK_FALLBACK = {
  textColor: "#ffffff",
  subTextColor: "#a4a19a",
  axisLineColor: "oklch(30% 0.01 250)",
  splitLineColor: "oklch(40% 0.01 250)",
  tooltipBackgroundColor: "oklch(20% 0.01 250)",
  tooltipTextColor: "#ffffff",
};

/** 读主题 CSS 变量，拿不到时用兜底色 */
function readColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return value || fallback;
}

/**
 * 解析图表主题
 *
 * 颜色优先取全局主题变量（切换 .dark 时自动跟着变），
 * 取不到时退回内置色板，保证 SSR / 首帧也有颜色可用。
 *
 * @param mode 主题模式，auto 时跟随全局明暗
 * @param prefersDark 当前全局是否处于深色（system store 的 isDark）
 */
export function resolveTheme(
  mode: ChartThemeMode = "auto",
  prefersDark = false,
): ChartTheme {
  const isDark = mode === "dark" || (mode !== "light" && prefersDark);
  const fallback = isDark ? DARK_FALLBACK : LIGHT_FALLBACK;

  return {
    isDark,
    textColor: readColor("--clr-text", fallback.textColor),
    subTextColor: readColor("--clr-icon", fallback.subTextColor),
    axisLineColor: readColor("--clr-border-darker", fallback.axisLineColor),
    splitLineColor: readColor("--clr-border", fallback.splitLineColor),
    tooltipBackgroundColor: readColor(
      "--clr-bg-darker",
      fallback.tooltipBackgroundColor,
    ),
    tooltipTextColor: readColor("--clr-text", fallback.tooltipTextColor),
  };
}
