"use client";

import { useQuery } from "@tanstack/react-query";

import { authKeys } from "@/shares/constants/query-keys";

import { authService } from "../services/auth.service";

const CURRENT_USER_STALE_MS = 60_000;

/**
 * Lấy người dùng đang đăng nhập (kèm quyền và module đang bật).
 *
 * @param options - `enabled` để tắt truy vấn khi chưa cần.
 * @returns Trạng thái truy vấn React Query.
 */
export function useCurrentUser(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => authService.getCurrentUser(signal),
    staleTime: CURRENT_USER_STALE_MS,
    retry: false,
    enabled: options.enabled ?? true,
  });
}
