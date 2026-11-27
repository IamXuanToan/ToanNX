import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/** Quyền danh mục callback (khớp `system/permissions/callback_permission.py`). */
export const CALLBACK_PERMISSIONS = createResourcePermissions(SYSTEM_SCOPE, "callback", {
  read: PERMISSION_ACTION.read,
});
