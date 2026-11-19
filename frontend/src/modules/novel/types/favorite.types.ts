/**
 * Định nghĩa các kiểu dữ liệu liên quan đến Tiểu thuyết yêu thích (Favorite).
 *
 * Đồng bộ trực tiếp với OpenAPI schema của backend qua `ApiModel`.
 */

import type { ApiModel } from "@/shares/types/api-schema";

// ============================================================================
// FAVORITE TYPES
// ============================================================================

/** Dữ liệu một mục trong danh sách yêu thích của người dùng (khớp `FavoriteResponse`). */
export type FavoriteItem = ApiModel<"FavoriteResponse">;
