import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { NOVEL_SCOPE } from "../constants/query-keys";

/**
 * Quyền hạn của tài nguyên Author (Tác giả).
 *
 * Khớp hoàn toàn với `AuthorPermission` trong backend (`novel/permissions/author_permission.py`).
 */
export const AUTHOR_PERMISSIONS = createResourcePermissions(NOVEL_SCOPE, "author", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  update: PERMISSION_ACTION.update,
  delete: PERMISSION_ACTION.delete,
});

/** Kiểu dữ liệu giá trị quyền của Author. */
export type AuthorPermissionValue = (typeof AUTHOR_PERMISSIONS)[keyof typeof AUTHOR_PERMISSIONS];
