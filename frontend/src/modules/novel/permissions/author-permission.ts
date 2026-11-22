/**
 * Quyền hạn của tài nguyên Author (Tác giả).
 *
 * Khớp hoàn toàn với `AuthorPermission` trong backend (`novel/permissions/author_permission.py`).
 */
export const AUTHOR_PERMISSIONS = {
  /** Quyền xem danh sách và thông tin tác giả */
  read: "novel.author.read",
  /** Quyền tạo mới tác giả */
  create: "novel.author.create",
  /** Quyền cập nhật thông tin tác giả */
  update: "novel.author.update",
  /** Quyền xóa tác giả */
  delete: "novel.author.delete",
} as const;

/** Kiểu dữ liệu giá trị quyền của Author. */
export type AuthorPermissionValue = (typeof AUTHOR_PERMISSIONS)[keyof typeof AUTHOR_PERMISSIONS];
