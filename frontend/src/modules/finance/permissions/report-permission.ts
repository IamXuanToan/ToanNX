import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { FINANCE_SCOPE } from "../constants/query-keys";

/** Quyền của `ReportPermission` (khớp `app/finance/permissions/report_permission.py`). */
export const REPORT_PERMISSIONS = createResourcePermissions(FINANCE_SCOPE, "report", {
  read: PERMISSION_ACTION.read,
});
