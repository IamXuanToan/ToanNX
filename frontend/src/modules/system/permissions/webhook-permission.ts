import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/** Quyền danh mục webhook (khớp `system/permissions/webhook_permission.py`). */
export const WEBHOOK_PERMISSIONS = createResourcePermissions(SYSTEM_SCOPE, "webhook", {
  read: PERMISSION_ACTION.read,
});
