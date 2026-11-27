import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/**
 * Danh mục quyền hạn đối với tài nguyên Người dùng (User).
 *
 * Khớp chuẩn định danh quyền của backend `UserPermission`.
 */
export const USER_PERMISSIONS = createResourcePermissions(SYSTEM_SCOPE, "user", {
  userRead: PERMISSION_ACTION.read,
  userCreate: PERMISSION_ACTION.create,
  userUpdate: PERMISSION_ACTION.update,
  userDelete: PERMISSION_ACTION.delete,
});
