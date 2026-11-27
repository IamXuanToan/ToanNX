import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { WORKSPACE_SCOPE } from "../constants/query-keys";

/** Quyền của `VaultItemPermission` (khớp `vault_item_permission.py`). */
export const VAULT_ITEM_PERMISSIONS = createResourcePermissions(WORKSPACE_SCOPE, "vault_item", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  update: PERMISSION_ACTION.update,
  delete: PERMISSION_ACTION.delete,
  reveal: PERMISSION_ACTION.reveal,
  manageAll: PERMISSION_ACTION.manageAll,
});
