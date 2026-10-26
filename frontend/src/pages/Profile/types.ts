/** 资料页表单草稿：只包含接口允许修改的字段 */
export interface ProfileDraft {
  userName: string;
  /** 新选的头像（base64），空串表示没有修改 */
  userAvatar: string;
}

/** 账号信息行 */
export interface ProfileDetailItem {
  label: string;
  value: string;
}
