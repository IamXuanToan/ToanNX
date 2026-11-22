"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { accountKeys } from "../constants/query-keys";
import { userService } from "../services/user.service";
import type { UserFilters } from "../types/user.types";

/**
 * Danh sách người dùng (giữ dữ liệu trang trước khi chuyển trang).
 *
 * @param filters - Bộ lọc và phân trang.
 * @returns Truy vấn React Query danh sách người dùng.
 */
export function useUsers(filters: UserFilters) {
  return useListQuery(accountKeys.users(filters), (signal) => userService.list(filters, signal));
}
