import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/** Quyền của `NotificationPermission` (khớp `app/system/permissions/notification_permission.py`). */
export const NOTIFICATION_PERMISSIONS = createResourcePermissions(SYSTEM_SCOPE, "notification", {
  read: PERMISSION_ACTION.read,
});
