/**
 * Danh mục quyền hạn đối với tài nguyên Cấu hình hệ thống (Setting).
 *
 * Khớp chuẩn định danh quyền của backend `SettingPermission`.
 */
export const SETTING_PERMISSIONS = {
  settingRead: "system.setting.read",
  settingCreate: "system.setting.create",
  settingUpdate: "system.setting.update",
  settingDelete: "system.setting.delete",
} as const;
