import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/**
 * Quyền quản trị phiên đăng nhập, khớp `SessionPermission` ở backend.
 */
export const SESSION_PERMISSIONS = createResourcePermissions(SYSTEM_SCOPE, "session", {
  sessionDelete: PERMISSION_ACTION.delete,
  sessionRead: PERMISSION_ACTION.read,
  sessionRevoke: PERMISSION_ACTION.revoke,
});
