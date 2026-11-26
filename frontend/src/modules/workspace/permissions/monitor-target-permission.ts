import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { WORKSPACE_SCOPE } from "../constants/query-keys";

/** Quyền của `MonitorTargetPermission` (khớp `monitor_target_permission.py`). */
export const MONITOR_TARGET_PERMISSIONS = createResourcePermissions(
  WORKSPACE_SCOPE,
  "monitor_target",
  {
    read: PERMISSION_ACTION.read,
    create: PERMISSION_ACTION.create,
    update: PERMISSION_ACTION.update,
    delete: PERMISSION_ACTION.delete,
    manageAll: PERMISSION_ACTION.manageAll,
  },
);
