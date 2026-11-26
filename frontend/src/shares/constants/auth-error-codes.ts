/** Mã lỗi xác thực và CSRF tầng truyền tải khớp `ErrorCode` ở Backend (`app/core/constants/error_codes.py`). */
export const AUTH_ERROR_CODES = {
  tokenExpired: "AUTH_TOKEN_EXPIRED",
  tokenInvalid: "AUTH_TOKEN_INVALID",
  notAuthenticated: "AUTH_NOT_AUTHENTICATED",
  sessionInvalid: "AUTH_SESSION_INVALID",
  refreshConflict: "AUTH_REFRESH_CONFLICT",
  csrfFailed: "AUTH_CSRF_FAILED",
} as const;
