import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { UTILITIES_SCOPE } from "../constants/query-keys";

/**
 * Quyền hạn đối với tài nguyên Đường dẫn trang (PagePath).
 *
 * Khớp chuẩn backend `PagePathPermission`.
 */
export const PAGE_PATH_PERMISSIONS = createResourcePermissions(UTILITIES_SCOPE, "page_path", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  update: PERMISSION_ACTION.update,
  delete: PERMISSION_ACTION.delete,
});
