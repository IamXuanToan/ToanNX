"use client";

import { keepPreviousData, type QueryKey, useQuery } from "@tanstack/react-query";

/**
 * Truy vấn danh sách chuẩn: giữ dữ liệu trang trước khi đổi trang/bộ lọc (bảng không nháy trống).
 *
 * @param queryKey - Khóa (`<m>Keys.list(filters)`).
 * @param queryFn - Hàm gọi service.
 * @param options - `enabled` để chỉ tải khi có quyền.
 * @returns Truy vấn React Query.
 */
export function useListQuery<T>(
  queryKey: QueryKey,
  queryFn: (signal: AbortSignal) => Promise<T>,
  options: { enabled?: boolean; staleTime?: number } = {},
) {
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => queryFn(signal),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
    staleTime: options.staleTime,
  });
}
