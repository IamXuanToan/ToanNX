/**
 * Hook quản lý trạng thái và thao tác xóa lịch sử đọc truyện.
 */

"use client";

import { useClearHistory } from "../../../hooks/use-clear-history";
import { useDeleteHistoryItem } from "../../../hooks/use-delete-history-item";
import { useReadingHistory } from "../../../hooks/use-reading-history";

/**
 * Quản lý danh sách lịch sử đọc và các thao tác xóa của độc giả.
 *
 * @returns Danh sách lịch sử, trạng thái tải và các hàm xóa đơn lẻ/toàn bộ.
 */
export function useReadingHistoryComponent() {
  const query = useReadingHistory();
  const deleteItem = useDeleteHistoryItem();
  const clearAll = useClearHistory();

  return {
    historyList: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    deleteItem: (id: string) => deleteItem.mutate(id),
    isDeletingItem: deleteItem.isPending,
    clearAll: () => clearAll.mutate(),
    isClearingAll: clearAll.isPending,
  };
}
