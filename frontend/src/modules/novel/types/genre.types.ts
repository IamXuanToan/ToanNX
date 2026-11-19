/**
 * Định nghĩa kiểu dữ liệu liên quan đến Thể loại tiểu thuyết (Genre).
 *
 * Đồng bộ trực tiếp với OpenAPI schema của backend qua `ApiModel`.
 */

import type { ApiModel } from "@/shares/types/api-schema";

/** Kiểu dữ liệu tóm tắt của thể loại (khớp `GenreSummaryResponse`). */
export type GenreSummary = ApiModel<"GenreSummaryResponse">;
