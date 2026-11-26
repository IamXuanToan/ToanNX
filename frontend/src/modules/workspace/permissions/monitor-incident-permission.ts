import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { WORKSPACE_SCOPE } from "../constants/query-keys";

/** Quyền của `MonitorIncidentPermission` (khớp `monitor_incident_permission.py`). */
export const MONITOR_INCIDENT_PERMISSIONS = createResourcePermissions(
  WORKSPACE_SCOPE,
  "monitor_incident",
  {
    read: PERMISSION_ACTION.read,
    delete: PERMISSION_ACTION.delete,
    manageAll: PERMISSION_ACTION.manageAll,
  },
);
