import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/** Quyền của `AnnouncementPermission` (khớp `app/system/permissions/announcement_permission.py`). */
export const ANNOUNCEMENT_PERMISSIONS = createResourcePermissions(SYSTEM_SCOPE, "announcement", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  delete: PERMISSION_ACTION.delete,
});
