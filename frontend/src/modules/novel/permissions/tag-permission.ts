/**
 * Quyền hạn của tài nguyên Tag (Thẻ phân loại truyện).
 *
 * Khớp hoàn toàn với `TagPermission` trong backend (`novel/permissions/tag_permission.py`).
 */
export const TAG_PERMISSIONS = {
  /** Quyền xem danh sách và thông tin thẻ */
  read: "novel.tag.read",
  /** Quyền tạo mới thẻ */
  create: "novel.tag.create",
  /** Quyền cập nhật thông tin thẻ */
  update: "novel.tag.update",
  /** Quyền xóa thẻ */
  delete: "novel.tag.delete",
} as const;

/** Kiểu dữ liệu giá trị quyền của Tag. */
export type TagPermissionValue = (typeof TAG_PERMISSIONS)[keyof typeof TAG_PERMISSIONS];
