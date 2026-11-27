import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { WORKSPACE_SCOPE } from "../constants/query-keys";

/** Quyền của `WorkspaceSettingPermission` (khớp `workspace_setting_permission.py`). */
export const WORKSPACE_SETTING_PERMISSIONS = createResourcePermissions(
  WORKSPACE_SCOPE,
  "workspace_setting",
  {
    read: PERMISSION_ACTION.read,
    update: PERMISSION_ACTION.update,
    manageAll: PERMISSION_ACTION.manageAll,
  },
);
