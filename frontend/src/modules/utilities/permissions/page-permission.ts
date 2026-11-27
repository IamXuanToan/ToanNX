import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { UTILITIES_SCOPE } from "../constants/query-keys";

/**
 * Quyền hạn đối với tài nguyên Trang tùy chỉnh (Page).
 *
 * Khớp chuẩn backend `PagePermission`.
 */
export const PAGE_PERMISSIONS = createResourcePermissions(UTILITIES_SCOPE, "page", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  update: PERMISSION_ACTION.update,
  delete: PERMISSION_ACTION.delete,
  manageAll: PERMISSION_ACTION.manageAll,
});
