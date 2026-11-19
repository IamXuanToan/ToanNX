/**
 * Định nghĩa kiểu dữ liệu liên quan đến Thẻ phân loại (Tag).
 *
 * Đồng bộ trực tiếp với OpenAPI schema của backend qua `ApiModel`.
 */

import type { ApiModel } from "@/shares/types/api-schema";

/** Kiểu dữ liệu tóm tắt của thẻ (khớp `TagSummaryResponse`). */
export type Tag = ApiModel<"TagSummaryResponse">;
export type TagSummary = Tag;

/** Input tạo mới thẻ. */
export interface TagCreateInput {
  name: string;
  slug?: string;
}

/** Input cập nhật thẻ. */
export type TagUpdateInput = Partial<TagCreateInput>;
