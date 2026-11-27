import { CLIENT_ERROR_CODES } from "../lib/api/api-error";
import { AUTH_ERROR_CODES } from "./auth-error-codes";

/** Thời gian stale mặc định cho React Query toàn hệ thống (30 giây). */
export const QUERY_STALE_TIME_MS = 30_000;

/** Số lần thử lại tối đa cho lỗi tạm thời (mất mạng, timeout, 5xx). */
export const QUERY_MAX_RETRIES = 2;

export const HTTP_CLIENT_ERROR_MIN = 400;
export const HTTP_CLIENT_ERROR_MAX = 499;
export const HTTP_RATE_LIMIT_STATUS = 429;

/** Mã lỗi API không thể tự phục hồi nếu gửi lại cùng một request. */
export const NON_RETRYABLE_API_ERROR_CODES = new Set<string>([
  ...Object.values(AUTH_ERROR_CODES),
  CLIENT_ERROR_CODES.cancelled,
  CLIENT_ERROR_CODES.invalidResponse,
  "VALIDATION_ERROR",
  "PARSE_ERROR",
  "NOT_FOUND",
  "METHOD_NOT_ALLOWED",
  "UNSUPPORTED_MEDIA_TYPE",
  "CONFLICT",
  "BUSINESS_RULE_VIOLATION",
  "RATE_LIMITED",
  "QUOTA_EXCEEDED",
  "PERMISSION_DENIED",
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_USER_INACTIVE",
  "AUTH_REFRESH_INVALID",
  "AUTH_REFRESH_EXPIRED",
  "AUTH_REFRESH_REVOKED",
  "AUTH_REFRESH_REUSED",
  "AUTH_PASSWORD_RESET_TOKEN_INVALID",
]);
