import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/** Quyền của `NotificationPreferencePermission` (khớp `app/system/permissions/notification_preference_permission.py`). */
export const NOTIFICATION_PREFERENCE_PERMISSIONS = createResourcePermissions(
  SYSTEM_SCOPE,
  "notification_preference",
  {
    read: PERMISSION_ACTION.read,
    update: PERMISSION_ACTION.update,
  },
);
