/**
 * Định nghĩa kiểu dữ liệu liên quan đến Thể loại tiểu thuyết (Genre).
 *
 * Đồng bộ trực tiếp với OpenAPI schema của backend qua `ApiModel`.
 */

import type { ApiModel } from "@/shares/types/api-schema";

/** Kiểu dữ liệu tóm tắt của thể loại (khớp `GenreSummaryResponse`). */
export type Genre = ApiModel<"GenreSummaryResponse">;
export type GenreSummary = Genre;

/** Input tạo mới thể loại. */
export interface GenreCreateInput {
  name: string;
  slug?: string;
  description?: string;
}

/** Input cập nhật thể loại. */
export type GenreUpdateInput = Partial<GenreCreateInput>;
