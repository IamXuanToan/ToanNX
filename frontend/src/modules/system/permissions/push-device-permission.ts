import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/** Quyền của `PushDevicePermission` (khớp `app/system/permissions/push_device_permission.py`). */
export const PUSH_DEVICE_PERMISSIONS = createResourcePermissions(SYSTEM_SCOPE, "push_device", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  delete: PERMISSION_ACTION.delete,
});
