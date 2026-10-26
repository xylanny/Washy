export type SettingSectionName = "appearance" | "charts" | "table";

export interface SettingSection {
  name: SettingSectionName;
  label: string;
}
