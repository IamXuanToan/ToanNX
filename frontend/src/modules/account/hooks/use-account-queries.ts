"use client";

import { useQuery } from "@tanstack/react-query";

import { accountKeys } from "../constants/query-keys";
import { userService } from "../services/user.service";

/**
 * Chi tiết người dùng.
 *
 * @param id - Id người dùng.
 * @param options - `enabled` để chỉ tải khi cần (ví dụ sao chép).
 * @returns Truy vấn React Query chi tiết người dùng.
 */
export function useUser(id: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: accountKeys.user(id),
    queryFn: ({ signal }) => userService.get(id, signal),
    enabled: options.enabled ?? true,
  });
}
