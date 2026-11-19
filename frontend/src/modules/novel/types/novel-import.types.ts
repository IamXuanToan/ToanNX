/**
 * Định nghĩa các kiểu dữ liệu liên quan đến Nhập khẩu tiểu thuyết (Novel Import).
 *
 * Đồng bộ trực tiếp với OpenAPI schema của backend qua `ApiModel`.
 */

import type { ApiModel } from "@/shares/types/api-schema";

/** Payload dữ liệu khi gửi import tiểu thuyết (khớp `NovelImportValidateRequest`). */
export type NovelImportPayload = ApiModel<"NovelImportValidateRequest">;

/** Kết quả trả về sau khi import tiểu thuyết thành công (khớp `NovelImportResultResponse`). */
export type NovelImportResult = ApiModel<"NovelImportResultResponse">;

/** Cấu trúc file mẫu (template) import tiểu thuyết (khớp `NovelImportTemplateResponse`). */
export type NovelImportTemplate = ApiModel<"NovelImportTemplateResponse">;
