/**
 * Định nghĩa kiểu dữ liệu liên quan đến Thẻ tiểu thuyết (Tag).
 *
 * Đồng bộ trực tiếp với OpenAPI schema của backend qua `ApiModel`.
 */

import type { ApiModel } from "@/shares/types/api-schema";

/** Kiểu dữ liệu tóm tắt của thẻ (khớp `TagSummaryResponse`). */
export type TagSummary = ApiModel<"TagSummaryResponse">;
