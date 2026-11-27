import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { NOVEL_SCOPE } from "../constants/query-keys";

/**
 * Quyền hạn của tài nguyên Genre (Thể loại truyện).
 *
 * Khớp hoàn toàn với `GenrePermission` trong backend (`novel/permissions/genre_permission.py`).
 */
export const GENRE_PERMISSIONS = createResourcePermissions(NOVEL_SCOPE, "genre", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  update: PERMISSION_ACTION.update,
  delete: PERMISSION_ACTION.delete,
});

/** Kiểu dữ liệu giá trị quyền của Genre. */
export type GenrePermissionValue = (typeof GENRE_PERMISSIONS)[keyof typeof GENRE_PERMISSIONS];
