import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { WORKSPACE_SCOPE } from "../constants/query-keys";

/** Quyền của `AssistantPermission` (khớp `assistant_permission.py`). */
export const ASSISTANT_PERMISSIONS = createResourcePermissions(WORKSPACE_SCOPE, "assistant", {
  chat: PERMISSION_ACTION.chat,
});
