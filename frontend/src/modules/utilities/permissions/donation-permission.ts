import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { UTILITIES_SCOPE } from "../constants/query-keys";

/**
 * Quyền của tài nguyên Quyên góp (DonationTransaction) theo chuẩn IAM.
 */
export const DONATION_PERMISSIONS = createResourcePermissions(UTILITIES_SCOPE, "donation", {
  read: PERMISSION_ACTION.read,
  update: PERMISSION_ACTION.update,
  export: PERMISSION_ACTION.export,
  manageAll: PERMISSION_ACTION.manageAll,
});
