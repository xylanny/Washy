export const THEMES = {
  system: "system",
  light: "light",
  dark: "dark",
} as const;

export type ThemeMode = keyof typeof THEMES;
