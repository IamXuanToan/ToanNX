"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { accountKeys } from "@/shares/constants/query-keys";

import { accountService } from "../services/account.service";
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
    queryFn: ({ signal }) => accountService.listUsers(filters, signal),
    placeholderData: keepPreviousData,
  });
}

/**
 * Chi tiết người dùng.
 *
 * @param id - Id người dùng.
 * @returns Truy vấn React Query.
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: accountKeys.user(id),
    queryFn: ({ signal }) => accountService.getUser(id, signal),
  });
}
