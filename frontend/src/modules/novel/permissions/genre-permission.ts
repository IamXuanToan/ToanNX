/**
 * Quyền hạn của tài nguyên Genre (Thể loại truyện).
 *
 * Khớp hoàn toàn với `GenrePermission` trong backend (`novel/permissions/genre_permission.py`).
 */
export const GENRE_PERMISSIONS = {
  /** Quyền xem danh sách và thông tin thể loại */
  read: "novel.genre.read",
  /** Quyền tạo mới thể loại */
  create: "novel.genre.create",
  /** Quyền cập nhật thông tin thể loại */
  update: "novel.genre.update",
  /** Quyền xóa thể loại */
  delete: "novel.genre.delete",
} as const;

/** Kiểu dữ liệu giá trị quyền của Genre. */
export type GenrePermissionValue = (typeof GENRE_PERMISSIONS)[keyof typeof GENRE_PERMISSIONS];
