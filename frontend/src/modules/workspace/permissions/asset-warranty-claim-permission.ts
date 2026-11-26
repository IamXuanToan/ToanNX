import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { WORKSPACE_SCOPE } from "../constants/query-keys";

/** Quyền của `AssetWarrantyClaimPermission` (khớp `asset_warranty_claim_permission.py`). */
export const ASSET_WARRANTY_CLAIM_PERMISSIONS = createResourcePermissions(
  WORKSPACE_SCOPE,
  "warranty_claim",
  {
    read: PERMISSION_ACTION.read,
    create: PERMISSION_ACTION.create,
    update: PERMISSION_ACTION.update,
    delete: PERMISSION_ACTION.delete,
    manageAll: PERMISSION_ACTION.manageAll,
  },
);
