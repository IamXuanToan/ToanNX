import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { UTILITIES_SCOPE } from "../constants/query-keys";

/**
 * Danh mục quyền hạn đối với tài nguyên Liên kết rút gọn (ShortLink).
 *
 * Khớp backend `ShortLinkPermission`.
 */
export const SHORT_LINK_PERMISSIONS = createResourcePermissions(UTILITIES_SCOPE, "short_link", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  update: PERMISSION_ACTION.update,
  delete: PERMISSION_ACTION.delete,
  manageAll: PERMISSION_ACTION.manageAll,
});
