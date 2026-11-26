import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/** Mã quyền IAM (khớp backend `IamPermission`). */
export const IAM_PERMISSIONS = {
  ...createResourcePermissions(SYSTEM_SCOPE, "role", {
    roleRead: PERMISSION_ACTION.read,
    roleCreate: PERMISSION_ACTION.create,
    roleUpdate: PERMISSION_ACTION.update,
    roleDelete: PERMISSION_ACTION.delete,
    roleAssign: PERMISSION_ACTION.assign,
  }),
  ...createResourcePermissions(SYSTEM_SCOPE, "permission", {
    permissionRead: PERMISSION_ACTION.read,
    permissionAssign: PERMISSION_ACTION.assign,
  }),
} as const;
