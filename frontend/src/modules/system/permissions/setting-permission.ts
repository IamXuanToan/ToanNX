import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/**
 * Danh mục quyền hạn đối với tài nguyên Cấu hình hệ thống (Setting).
 *
 * Khớp chuẩn định danh quyền của backend `SettingPermission`.
 */
export const SETTING_PERMISSIONS = createResourcePermissions(SYSTEM_SCOPE, "setting", {
  settingRead: PERMISSION_ACTION.read,
  settingCreate: PERMISSION_ACTION.create,
  settingUpdate: PERMISSION_ACTION.update,
  settingDelete: PERMISSION_ACTION.delete,
});
