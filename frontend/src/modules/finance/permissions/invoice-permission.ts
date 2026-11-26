import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { FINANCE_SCOPE } from "../constants/query-keys";

/** Quyền của `InvoicePermission` (khớp `app/finance/permissions/invoice_permission.py`). */
export const INVOICE_PERMISSIONS = createResourcePermissions(FINANCE_SCOPE, "invoice", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  update: PERMISSION_ACTION.update,
  delete: PERMISSION_ACTION.delete,
  manageAll: PERMISSION_ACTION.manageAll,
});
