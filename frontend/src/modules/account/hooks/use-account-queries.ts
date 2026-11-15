"use client";

import { useQuery } from "@tanstack/react-query";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { accountKeys } from "../constants/query-keys";
import { userService } from "../services/user.service";
import type { UserFilters } from "../types/account.types";

/**
 * Danh sách người dùng (giữ dữ liệu trang trước khi chuyển trang).
 *
 * @param filters - Bộ lọc và phân trang.
 * @returns Truy vấn React Query.
 */
export function useUsers(filters: UserFilters) {
  return useListQuery(accountKeys.users(filters), (signal) => userService.list(filters, signal));
}

/**
 * Chi tiết người dùng.
 *
 * @param id - Id người dùng.
 * @param options - `enabled` để chỉ tải khi cần (ví dụ sao chép).
 * @returns Truy vấn React Query.
 */
export function useUser(id: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: accountKeys.user(id),
    queryFn: ({ signal }) => userService.get(id, signal),
    enabled: options.enabled ?? true,
  });
}
