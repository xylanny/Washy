import type { ProfileDetailItem } from "../types";

/** 只读账号信息卡片 */
export interface ProfileDetailsProps {
  /** 卡片标题 */
  title?: string;
  /** 一行一条的只读信息 */
  items: ProfileDetailItem[];
}
