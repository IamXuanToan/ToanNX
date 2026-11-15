import { apiClient } from "@/shares/lib/api/api-client";

import { HOME_API_ENDPOINTS } from "../constants/api-endpoints";

/** Giới hạn khớp `ClientErrorReportValidateSerializer` của BE. */
const LIMITS = { message: 1000, digest: 100, url: 500, stack: 4000 } as const;

/**
 * Service báo lỗi trình duyệt (BE `health/views/client_error_view.py`). Không bao giờ ném lỗi: báo lỗi hỏng
 * thì bỏ qua, không làm hỏng thêm trang lỗi.
 */
export const clientErrorService = {
  /**
   * Gửi lỗi bắt được ở error boundary. URL không gồm query (có thể chứa dữ liệu người dùng).
   *
   * @param error - Giá trị bị ném (có thể không phải `Error`).
   */
  async report(error: unknown): Promise<void> {
    const value = error instanceof Error ? error : new Error(String(error));
    const digest = (value as Error & { digest?: string }).digest ?? "";
    try {
      await apiClient.post(HOME_API_ENDPOINTS.clientErrors, {
        message: (value.message || value.name).slice(0, LIMITS.message),
        digest: digest.slice(0, LIMITS.digest),
        url: window.location.pathname.slice(0, LIMITS.url),
        stack: (value.stack ?? "").slice(0, LIMITS.stack),
      });
    } catch {
      /* Báo lỗi thất bại: bỏ qua. */
    }
  },
};
