/**
 * Định nghĩa kiểu dữ liệu liên quan đến Tác giả (Author).
 *
 * Đồng bộ trực tiếp với OpenAPI schema của backend qua `ApiModel`.
 */

import type { ApiModel } from "@/shares/types/api-schema";

// ============================================================================
// AUTHOR TYPES
// ============================================================================

/** Kiểu dữ liệu tóm tắt của tác giả (khớp `AuthorSummaryResponse`). */
export type AuthorSummary = ApiModel<"AuthorSummaryResponse">;
