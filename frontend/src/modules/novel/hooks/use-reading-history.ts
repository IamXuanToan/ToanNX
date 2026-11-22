/**
 * Hook truy vấn danh sách lịch sử đọc truyện của người dùng.
 */

import { useQuery } from "@tanstack/react-query";

import { novelKeys } from "../constants/query-keys";
import { readingHistoryService } from "../services/reading-history.service";
import type { ReadingHistoryItem } from "../types/reading-history.types";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook lấy toàn bộ lịch sử đọc truyện của độc giả hiện tại.
 *
 * @returns Query state chứa mảng `ReadingHistoryItem`.
 */
export function useReadingHistory() {
  return useQuery<ReadingHistoryItem[]>({
    queryKey: novelKeys.readingHistory(),
    queryFn: ({ signal }) => readingHistoryService.getHistory(signal),
    staleTime: 15_000,
  });
}
