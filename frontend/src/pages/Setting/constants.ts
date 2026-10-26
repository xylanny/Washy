import type { FormSelectOption } from "@/components/Form/FormSelect/types";
import type { SettingSection } from "./types";

/** 左侧分类，顺序即展示顺序 */
export const SECTIONS: SettingSection[] = [
  { name: "appearance", label: "Appearance" },
  { name: "charts", label: "Charts" },
  { name: "table", label: "Table" },
];

/** 主题候选 */
export const THEME_OPTIONS: FormSelectOption[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

/** 图表预览行数候选 */
export const POINT_OPTIONS: FormSelectOption[] = [
  { label: "500 rows", value: 500 },
  { label: "1,000 rows", value: 1_000 },
  { label: "2,000 rows", value: 2_000 },
  { label: "5,000 rows", value: 5_000 },
];
