import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { WORKSPACE_SCOPE } from "../constants/query-keys";

/** Quyền của `AssistantConversationPermission` (khớp `assistant_conversation_permission.py`). */
export const ASSISTANT_CONVERSATION_PERMISSIONS = createResourcePermissions(
  WORKSPACE_SCOPE,
  "assistant_conversation",
  {
    read: PERMISSION_ACTION.read,
    delete: PERMISSION_ACTION.delete,
    manageAll: PERMISSION_ACTION.manageAll,
  },
);
