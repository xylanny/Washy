/** 头像 + 用户名区：头像点击即换图，名字点击即就地编辑 */
export interface ProfileIdentityProps {
  /** 用户名字符串（受控） */
  name: string;
  /** 邮箱，只读展示 */
  email: string;
  /** 头像 base64（不含 data: 前缀） */
  avatar?: string;
  /** 保存中或未登录时禁用全部交互 */
  disabled?: boolean;
}

/** 头像 + 用户名区事件 */
export interface ProfileIdentityEmits {
  (e: "update:name", value: string): void;
  (e: "update:avatar", value: string): void;
  (e: "error", message: string): void;
}
