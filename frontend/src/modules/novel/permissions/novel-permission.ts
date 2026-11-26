import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { NOVEL_SCOPE } from "../constants/query-keys";

/**
 * Quyền hạn của tài nguyên Novel (Tiểu thuyết).
 *
 * Khớp hoàn toàn với `NovelPermission` trong backend (`novel/permissions/novel_permission.py`).
 */
export const NOVEL_PERMISSIONS = createResourcePermissions(NOVEL_SCOPE, "novel", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  update: PERMISSION_ACTION.update,
  delete: PERMISSION_ACTION.delete,
  manageAll: PERMISSION_ACTION.manageAll,
  import: PERMISSION_ACTION.import,
});

/** Kiểu dữ liệu giá trị quyền của Novel. */
export type NovelPermissionValue = (typeof NOVEL_PERMISSIONS)[keyof typeof NOVEL_PERMISSIONS];
