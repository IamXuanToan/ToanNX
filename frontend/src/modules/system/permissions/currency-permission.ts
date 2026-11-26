import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/** Quyền của `CurrencyPermission` (khớp `app/system/permissions/currency_permission.py`). */
export const CURRENCY_PERMISSIONS = createResourcePermissions(SYSTEM_SCOPE, "currency", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  update: PERMISSION_ACTION.update,
  delete: PERMISSION_ACTION.delete,
});
