import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { WORKSPACE_SCOPE } from "../constants/query-keys";

/** Quyền của `SubscriptionPaymentPermission` (khớp `subscription_payment_permission.py`). */
export const SUBSCRIPTION_PAYMENT_PERMISSIONS = createResourcePermissions(
  WORKSPACE_SCOPE,
  "subscription_payment",
  {
    read: PERMISSION_ACTION.read,
    delete: PERMISSION_ACTION.delete,
    manageAll: PERMISSION_ACTION.manageAll,
  },
);
