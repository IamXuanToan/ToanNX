/**
 * Định nghĩa các kiểu dữ liệu liên quan đến Tiểu thuyết (Novel).
 *
 * Đồng bộ trực tiếp với OpenAPI schema của backend qua `ApiModel`.
 */

import type { ApiModel } from "@/shares/types/api-schema";

// ============================================================================
// NOVEL ENUMS & TYPES
// ============================================================================

/** Trạng thái xuất bản của tiểu thuyết (ONGOING, COMPLETED, PAUSED). */
export type NovelStatus = "ONGOING" | "COMPLETED" | "PAUSED";

/** Kiểu dữ liệu đại diện cho một tiểu thuyết trong danh sách (khớp `NovelListResponse`). */
export type Novel = ApiModel<"NovelListResponse">;

/** Kiểu dữ liệu chi tiết đầy đủ của tiểu thuyết trong trang quản trị (khớp `NovelDetailResponse`). */
export type NovelDetail = ApiModel<"NovelDetailResponse">;

/** Kiểu dữ liệu chi tiết tiểu thuyết dành cho giao diện độc giả (khớp `NovelClientDetailResponse`). */
export type NovelClientDetail = ApiModel<"NovelClientDetailResponse">;

/** Input tạo mới tiểu thuyết. */
export interface NovelCreateInput {
  title: string;
  slug?: string;
  originalTitle?: string;
  authorId?: string | null;
  thumbnailId?: string | null;
  description?: string;
  status?: NovelStatus;
  genreIds?: string[];
  tagIds?: string[];
  isPublished?: boolean;
}

/** Input cập nhật tiểu thuyết. */
export type NovelUpdateInput = Partial<NovelCreateInput>;

export * from "./chapter.types";
export * from "./author.types";
export * from "./genre.types";
export * from "./tag.types";
export * from "./favorite.types";
export * from "./reading-history.types";
export * from "./novel-import.types";
export * from "./reader-settings.types";
