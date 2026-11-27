import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { NOVEL_SCOPE } from "../constants/query-keys";

/**
 * Quyền hạn của tài nguyên Tag (Thẻ phân loại truyện).
 *
 * Khớp hoàn toàn với `TagPermission` trong backend (`novel/permissions/tag_permission.py`).
 */
export const TAG_PERMISSIONS = createResourcePermissions(NOVEL_SCOPE, "tag", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  update: PERMISSION_ACTION.update,
  delete: PERMISSION_ACTION.delete,
});

/** Kiểu dữ liệu giá trị quyền của Tag. */
export type TagPermissionValue = (typeof TAG_PERMISSIONS)[keyof typeof TAG_PERMISSIONS];
