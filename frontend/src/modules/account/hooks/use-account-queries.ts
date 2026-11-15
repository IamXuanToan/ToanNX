"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

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
  return useQuery({
    queryKey: accountKeys.users(filters),
    queryFn: ({ signal }) => userService.list(filters, signal),
    placeholderData: keepPreviousData,
  });
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
