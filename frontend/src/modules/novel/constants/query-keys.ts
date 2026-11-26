/**
 * Khóa cache (Query Keys) React Query của module Novel (Truyện chữ).
 */

import { createResourceKeys } from "@/shares/lib/api/resource-keys";

// ============================================================================
// BASE CACHE KEY
// ============================================================================

/** Phạm vi chung của query key module Truyện (`["novel"]`). */
export const NOVEL_SCOPE = "novel";

// ============================================================================
// RESOURCE KEYS
// ============================================================================

/**
 * Tập hợp khóa cache quản lý state của module Novel.
 */
export const novelKeys = {
  /** Bộ query key CRUD tiểu thuyết */
  novel: createResourceKeys(NOVEL_SCOPE, "novels"),
  /** Bộ query key CRUD chương truyện */
  chapter: createResourceKeys(NOVEL_SCOPE, "chapters"),
  /** Bộ query key CRUD tác giả */
  author: createResourceKeys(NOVEL_SCOPE, "authors"),
  /** Bộ query key CRUD thể loại */
  genre: createResourceKeys(NOVEL_SCOPE, "genres"),
  /** Bộ query key CRUD thẻ */
  tag: createResourceKeys(NOVEL_SCOPE, "tags"),
  /**
   * Khóa cache cho danh mục tiểu thuyết công khai (kèm bộ lọc)
   * @param filters - Bộ lọc từ khóa và trạng thái
   */
  catalog: (filters: object) => [NOVEL_SCOPE, "catalog", filters] as const,
  /**
   * Khóa cache cho chi tiết truyện độc giả
   * @param slug - Slug của tiểu thuyết
   */
  clientNovel: (slug: string) => [NOVEL_SCOPE, "client", "novel", slug] as const,
  /**
   * Khóa cache cho nội dung chương đọc
   * @param novelSlug - Slug của tiểu thuyết
   * @param chapterNumber - Số chương
   */
  clientChapter: (novelSlug: string, chapterNumber: number | string) =>
    [NOVEL_SCOPE, "client", "chapter", novelSlug, String(chapterNumber)] as const,
  /** Khóa cache danh sách lịch sử đọc */
  readingHistory: () => [NOVEL_SCOPE, "reading-history"] as const,
  /** Khóa cache danh sách truyện yêu thích */
  favorites: () => [NOVEL_SCOPE, "favorites"] as const,
};
