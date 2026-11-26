import { describe, expect, it } from "vitest";

import { AUTH_ERROR_CODES } from "@/shares/constants/auth-error-codes";
import { QUERY_MAX_RETRIES, QUERY_STALE_TIME_MS } from "@/shares/constants/query-config";
import { ApiError, CLIENT_ERROR_CODES } from "@/shares/lib/api/api-error";
import { createQueryClient, shouldRetryQuery } from "@/shares/lib/query-client";

describe("createQueryClient & shouldRetryQuery", () => {
  it("áp dụng cấu hình mặc định staleTime 30s, tắt refetchOnWindowFocus và không retry mutation", () => {
    const qc = createQueryClient();
    const defaults = qc.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(QUERY_STALE_TIME_MS);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.mutations?.retry).toBe(false);
  });

  it("chỉ retry tối đa 2 lần cho lỗi tạm thời (mất mạng, timeout, 5xx)", () => {
    const transientErrors = [
      new ApiError({ status: 0, code: CLIENT_ERROR_CODES.network, message: "Mất mạng" }),
      new ApiError({ status: 0, code: CLIENT_ERROR_CODES.timeout, message: "Quá thời gian" }),
      new ApiError({ status: 500, code: "INTERNAL_ERROR", message: "Lỗi server" }),
      new ApiError({ status: 503, code: "SERVICE_UNAVAILABLE", message: "Bảo trì" }),
      new Error("Unexpected network hiccup"),
    ];

    for (const err of transientErrors) {
      expect(shouldRetryQuery(0, err)).toBe(true);
      expect(shouldRetryQuery(1, err)).toBe(true);
      expect(shouldRetryQuery(QUERY_MAX_RETRIES, err)).toBe(false);
    }
  });

  it("không auto-retry các lỗi không thể phục hồi theo status lẫn mã lỗi nghiệp vụ", () => {
    const unrecoverableErrors = [
      new ApiError({ status: 0, code: CLIENT_ERROR_CODES.cancelled, message: "Đã hủy" }),
      new ApiError({ status: 400, code: "VALIDATION_ERROR", message: "Dữ liệu sai" }),
      new ApiError({ status: 401, code: AUTH_ERROR_CODES.notAuthenticated, message: "401" }),
      new ApiError({ status: 401, code: AUTH_ERROR_CODES.tokenExpired, message: "Hết hạn" }),
      new ApiError({ status: 401, code: AUTH_ERROR_CODES.csrfFailed, message: "CSRF" }),
      new ApiError({ status: 403, code: "PERMISSION_DENIED", message: "Cấm truy cập" }),
      new ApiError({ status: 404, code: "NOT_FOUND", message: "Không tìm thấy" }),
      new ApiError({ status: 409, code: "CONFLICT", message: "Xung đột" }),
      new ApiError({ status: 422, code: "BUSINESS_RULE_VIOLATION", message: "Sai nghiệp vụ" }),
      new ApiError({ status: 429, code: "RATE_LIMITED", message: "Quá nhanh" }),
      // Bảo vệ theo mã lỗi ngay cả khi proxy trả status bất thường
      new ApiError({ status: 500, code: "QUOTA_EXCEEDED", message: "Vượt hạn mức" }),
      new ApiError({ status: 502, code: "RATE_LIMITED", message: "Rate limit qua gateway" }),
    ];

    for (const err of unrecoverableErrors) {
      expect(shouldRetryQuery(0, err)).toBe(false);
    }
  });
});
