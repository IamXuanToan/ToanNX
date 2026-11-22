import { QueryClient } from "@tanstack/react-query";

import { CLIENT_ERROR_CODES, isApiError } from "./api/api-error";

const STALE_TIME_MS = 30_000;
const MAX_RETRIES = 2;

/**
 * Tạo QueryClient. Không retry lỗi 4xx (lỗi nghiệp vụ/quyền); chỉ retry lỗi mạng/5xx.
 *
 * @returns QueryClient mới.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isApiError(error) && error.code === CLIENT_ERROR_CODES.cancelled) return false;
          if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
          return failureCount < MAX_RETRIES;
        },
      },
      mutations: { retry: false },
    },
  });
}
