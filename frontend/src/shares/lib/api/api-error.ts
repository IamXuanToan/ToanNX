/** Mã lỗi phía client (không đến từ backend). */
export const CLIENT_ERROR_CODES = {
  network: "NETWORK_ERROR",
  timeout: "TIMEOUT",
  invalidResponse: "INVALID_RESPONSE",
} as const;

/** Lỗi API đã chuẩn hóa từ response `{ success: false, error: {...} }`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;
  readonly requestId: string | null;

  /**
   * Khởi tạo lỗi API.
   *
   * @param init - Thông tin lỗi.
   */
  constructor(init: {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string | null;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details ?? {};
    this.requestId = init.requestId ?? null;
  }

  /**
   * Lỗi theo field (VALIDATION_ERROR) dạng `{ field: [messages] }`.
   *
   * @returns Map field → thông báo đầu tiên.
   */
  fieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [field, value] of Object.entries(this.details)) {
      if (Array.isArray(value) && typeof value[0] === "string") result[field] = value[0];
    }
    return result;
  }
}

/**
 * Kiểm tra một giá trị có phải ApiError.
 *
 * @param error - Giá trị bất kỳ.
 * @returns True nếu là ApiError.
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
