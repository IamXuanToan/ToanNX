import { QueryClient } from "@tanstack/react-query";

import {
  HTTP_CLIENT_ERROR_MAX,
  HTTP_CLIENT_ERROR_MIN,
  HTTP_RATE_LIMIT_STATUS,
  NON_RETRYABLE_API_ERROR_CODES,
  QUERY_MAX_RETRIES,
  QUERY_STALE_TIME_MS,
} from "../constants/query-config";
import { isApiError } from "./api/api-error";

/**
 * Quyết định React Query có tự thử lại khi gặp lỗi hay không.
 * - Thử lại tối đa 2 lần cho lỗi tạm thời (mất mạng, timeout, 5xx ngoài danh sách chặn).
 * - Không tự thử lại lỗi không thể phục hồi: validation, auth/session hỏng sau refresh,
 *   permission denied, not found, rate limit (429 / RATE_LIMITED), quota exceeded, conflict.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isApiError(error)) {
    if (NON_RETRYABLE_API_ERROR_CODES.has(error.code)) return false;
    if (error.status === HTTP_RATE_LIMIT_STATUS) return false;
    if (error.status >= HTTP_CLIENT_ERROR_MIN && error.status <= HTTP_CLIENT_ERROR_MAX) {
      return false;
    }
  }
  return failureCount < QUERY_MAX_RETRIES;
}

/**
 * Tạo QueryClient dùng chung trong app. Không retry lỗi 4xx hoặc lỗi không thể phục hồi.
 *
 * @returns QueryClient mới.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
      },
      mutations: { retry: false },
    },
  });
}
