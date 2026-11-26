import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/** Quyền của `NotificationDeliveryPermission` (khớp `app/system/permissions/notification_delivery_permission.py`). */
export const NOTIFICATION_DELIVERY_PERMISSIONS = createResourcePermissions(
  SYSTEM_SCOPE,
  "notification_delivery",
  {
    read: PERMISSION_ACTION.read,
    update: PERMISSION_ACTION.update,
    delete: PERMISSION_ACTION.delete,
    manageAll: PERMISSION_ACTION.manageAll,
  },
);
