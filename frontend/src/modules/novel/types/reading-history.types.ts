/**
 * Định nghĩa các kiểu dữ liệu liên quan đến Lịch sử đọc truyện (Reading History).
 *
 * Đồng bộ trực tiếp với OpenAPI schema của backend qua `ApiModel`.
 */

import type { ApiModel } from "@/shares/types/api-schema";

// ============================================================================
// READING HISTORY TYPES
// ============================================================================

/** Dữ liệu một mục trong lịch sử đọc truyện của người dùng (khớp `ReadingHistoryResponse`). */
export type ReadingHistoryItem = ApiModel<"ReadingHistoryResponse">;
