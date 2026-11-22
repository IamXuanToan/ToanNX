/**
 * Định nghĩa các kiểu dữ liệu liên quan đến Chương truyện (Chapter).
 *
 * Đồng bộ trực tiếp với OpenAPI schema của backend qua `ApiModel`.
 */

import type { ApiModel } from "@/shares/types/api-schema";

// ============================================================================
// CHAPTER TYPES
// ============================================================================

/** Kiểu dữ liệu chi tiết của chương truyện kèm nội dung văn bản (khớp `ChapterDetailResponse`). */
export type ChapterDetail = ApiModel<"ChapterDetailResponse">;

/** Dữ liệu tóm tắt của một chương trong danh sách chương (khớp `ChapterListResponse`). */
export type ChapterListItem = ApiModel<"ChapterListResponse">;
export type Chapter = ChapterListItem;

/** Input tạo mới chương truyện. */
export interface ChapterCreateInput {
  novelId: string;
  chapterNumber: number;
  title: string;
  slug?: string;
  content: string;
  thumbnailId?: string | null;
  isPublished?: boolean;
}

/** Input cập nhật chương truyện. */
export type ChapterUpdateInput = Partial<ChapterCreateInput>;
