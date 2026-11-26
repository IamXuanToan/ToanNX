import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { WORKSPACE_SCOPE } from "../constants/query-keys";

/** Quyền cấu hình Chatbot AI dùng chung (Admin, khớp `assistant_config_permission.py`). */
export const ASSISTANT_CONFIG_PERMISSIONS = createResourcePermissions(
  WORKSPACE_SCOPE,
  "assistant_config",
  {
    read: PERMISSION_ACTION.read,
    update: PERMISSION_ACTION.update,
  },
);
