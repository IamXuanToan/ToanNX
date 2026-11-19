/**
 * Quyền hạn của tài nguyên Chapter (Chương truyện).
 *
 * Khớp hoàn toàn với `ChapterPermission` trong backend (`novel/permissions/chapter_permission.py`).
 */
export const CHAPTER_PERMISSIONS = {
  /** Quyền xem danh sách và nội dung chi tiết chương */
  read: "novel.chapter.read",
  /** Quyền tạo mới chương truyện */
  create: "novel.chapter.create",
  /** Quyền cập nhật nội dung chương truyện */
  update: "novel.chapter.update",
  /** Quyền xóa chương truyện */
  delete: "novel.chapter.delete",
} as const;

/** Kiểu dữ liệu giá trị quyền của Chapter. */
export type ChapterPermissionValue = (typeof CHAPTER_PERMISSIONS)[keyof typeof CHAPTER_PERMISSIONS];
