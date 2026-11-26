import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { NOVEL_SCOPE } from "../constants/query-keys";

/**
 * Quyền hạn của tài nguyên Chapter (Chương truyện).
 *
 * Khớp hoàn toàn với `ChapterPermission` trong backend (`novel/permissions/chapter_permission.py`).
 */
export const CHAPTER_PERMISSIONS = createResourcePermissions(NOVEL_SCOPE, "chapter", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  update: PERMISSION_ACTION.update,
  delete: PERMISSION_ACTION.delete,
});

/** Kiểu dữ liệu giá trị quyền của Chapter. */
export type ChapterPermissionValue = (typeof CHAPTER_PERMISSIONS)[keyof typeof CHAPTER_PERMISSIONS];
