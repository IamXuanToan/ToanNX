import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/**
 * Danh mục quyền hạn đối với tài nguyên Ngôn ngữ (`Language`).
 *
 * Khớp backend `LanguagePermission`.
 */
export const LANGUAGE_PERMISSIONS = createResourcePermissions(SYSTEM_SCOPE, "language", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  update: PERMISSION_ACTION.update,
  delete: PERMISSION_ACTION.delete,
  manageAll: PERMISSION_ACTION.manageAll,
});
