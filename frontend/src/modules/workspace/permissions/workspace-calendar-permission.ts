import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { WORKSPACE_SCOPE } from "../constants/query-keys";

/** Quyền của `WorkspaceCalendarPermission` (khớp `workspace_calendar_permission.py`). */
export const WORKSPACE_CALENDAR_PERMISSIONS = createResourcePermissions(
  WORKSPACE_SCOPE,
  "calendar",
  {
    read: PERMISSION_ACTION.read,
    manageAll: PERMISSION_ACTION.manageAll,
  },
);
