import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { WORKSPACE_SCOPE } from "../constants/query-keys";

/** Quyền của `WorkspaceDashboardPermission` (khớp `workspace_dashboard_permission.py`). */
export const WORKSPACE_DASHBOARD_PERMISSIONS = createResourcePermissions(
  WORKSPACE_SCOPE,
  "dashboard",
  {
    read: PERMISSION_ACTION.read,
    manageAll: PERMISSION_ACTION.manageAll,
  },
);
