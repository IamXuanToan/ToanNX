import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/** Quyền của `ExchangeRatePermission` (khớp `app/system/permissions/exchange_rate_permission.py`). */
export const EXCHANGE_RATE_PERMISSIONS = createResourcePermissions(SYSTEM_SCOPE, "exchange_rate", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  update: PERMISSION_ACTION.update,
  delete: PERMISSION_ACTION.delete,
});
