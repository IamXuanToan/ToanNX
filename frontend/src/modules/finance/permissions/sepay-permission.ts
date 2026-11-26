import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { FINANCE_SCOPE } from "../constants/query-keys";

/** Quyền của `SepayPermission` (khớp `app/finance/permissions/sepay_permission.py`). */
export const SEPAY_PERMISSIONS = createResourcePermissions(FINANCE_SCOPE, "sepay", {
  manage: PERMISSION_ACTION.manage,
});
