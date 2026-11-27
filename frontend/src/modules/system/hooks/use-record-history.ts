"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { journalKeys } from "../constants/query-keys";
import { journalEntryService } from "../services/journal-entry.service";

const RECORD_HISTORY_PAGE_SIZE = 10;

/**
 * Lấy lịch sử thay đổi của một bản ghi theo dạng phân trang nối tiếp (10 mục gần nhất trước,
 * bấm "Xem hoạt động cũ hơn" để tải thêm).
 *
 * @param path - Đường dẫn API lấy lịch sử (`…/{id}/history`).
 * @param enabled - Có quyền đọc bản ghi hay không.
 * @returns Truy vấn React Query Infinite lịch sử bản ghi, danh sách gộp và tổng số mốc.
 */
export function useRecordHistory(path: string, enabled = true) {
  const query = useInfiniteQuery({
    queryKey: [...journalKeys.record(path), "infinite"] as const,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      journalEntryService.forRecordPage(
        path,
        { page: pageParam, pageSize: RECORD_HISTORY_PAGE_SIZE },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled,
  });

  const entries = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages[0]?.pagination.total ?? entries.length;

  return {
    ...query,
    entries,
    total,
  };
}
