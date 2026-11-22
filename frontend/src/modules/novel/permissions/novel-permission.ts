/**
 * Quyền hạn của tài nguyên Novel (Tiểu thuyết).
 *
 * Khớp hoàn toàn với `NovelPermission` trong backend (`novel/permissions/novel_permission.py`).
 */
export const NOVEL_PERMISSIONS = {
  /** Quyền xem danh sách và chi tiết tiểu thuyết */
  read: "novel.novel.read",
  /** Quyền tạo mới tiểu thuyết */
  create: "novel.novel.create",
  /** Quyền cập nhật thông tin tiểu thuyết */
  update: "novel.novel.update",
  /** Quyền xóa tiểu thuyết */
  delete: "novel.novel.delete",
  /** Quyền quản trị toàn bộ tiểu thuyết (kể cả của người dùng khác) */
  manageAll: "novel.novel.manage_all",
  /** Quyền import tiểu thuyết và các chương từ file cấu trúc dữ liệu */
  import: "novel.novel.import",
} as const;

/** Kiểu dữ liệu giá trị quyền của Novel. */
export type NovelPermissionValue = (typeof NOVEL_PERMISSIONS)[keyof typeof NOVEL_PERMISSIONS];
