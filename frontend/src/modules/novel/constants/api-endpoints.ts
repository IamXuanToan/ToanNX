/**
 * Danh mục endpoint API của module Novel (Truyện chữ).
 *
 * Khớp hoàn toàn với URL cấu hình ở backend (`novel/urls.py`), không có dấu gạch chéo cuối (`/`).
 */

// ============================================================================
// BASE CONSTANTS
// ============================================================================

const NOVEL_API_BASE = "/novel";

// ============================================================================
// ENDPOINTS
// ============================================================================

export const NOVEL_API_ENDPOINTS = {
  /** Endpoint CRUD danh sách và chi tiết tiểu thuyết */
  novels: `${NOVEL_API_BASE}/novels`,
  /** Endpoint CRUD danh sách và chi tiết chương truyện */
  chapters: `${NOVEL_API_BASE}/chapters`,
  /** Endpoint tải file mẫu JSON dùng để import truyện */
  importTemplate: `${NOVEL_API_BASE}/novels/import-template`,
  /** Endpoint gửi payload import toàn bộ truyện kèm các chương */
  importNovel: `${NOVEL_API_BASE}/novels/import`,
  /**
   * Endpoint lấy chi tiết tiểu thuyết dành riêng cho phía độc giả
   * @param slug - Slug của tiểu thuyết
   */
  clientNovel: (slug: string) => `${NOVEL_API_BASE}/client/novels/${slug}`,
  /**
   * Endpoint lấy nội dung chương cho màn đọc của độc giả
   * @param novelSlug - Slug của tiểu thuyết
   * @param chapterNumber - Số thứ tự chương
   */
  clientChapter: (novelSlug: string, chapterNumber: number | string) =>
    `${NOVEL_API_BASE}/client/chapters/${novelSlug}/${chapterNumber}`,
  /** Endpoint danh sách và ghi nhận lịch sử đọc */
  readingHistory: `${NOVEL_API_BASE}/reading-history`,
  /**
   * Endpoint xóa một bản ghi lịch sử đọc cụ thể
   * @param id - ID của bản ghi lịch sử
   */
  readingHistoryItem: (id: string) => `${NOVEL_API_BASE}/reading-history/${id}`,
  /** Endpoint danh sách tiểu thuyết yêu thích */
  favorites: `${NOVEL_API_BASE}/favorites`,
  /** Endpoint bật/tắt yêu thích tiểu thuyết */
  favoriteToggle: `${NOVEL_API_BASE}/favorites/toggle`,
  /** Endpoint quản lý danh mục tác giả */
  authors: `${NOVEL_API_BASE}/authors`,
  /** Endpoint quản lý danh mục thể loại */
  genres: `${NOVEL_API_BASE}/genres`,
  /** Endpoint quản lý danh mục thẻ */
  tags: `${NOVEL_API_BASE}/tags`,
} as const;
