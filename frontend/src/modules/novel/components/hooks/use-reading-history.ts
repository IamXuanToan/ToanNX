"use client";

import { useState } from "react";

import { useClearHistory } from "../../hooks/use-clear-history";
import { useDeleteHistoryItem } from "../../hooks/use-delete-history-item";
import { useReadingHistory as useReadingHistoryQuery } from "../../hooks/use-reading-history";

/**
 * Hook quản lý danh sách lịch sử đọc và hộp thoại xác nhận xóa của ReadingHistory.
 *
 * @returns Danh sách lịch sử, trạng thái tải, trạng thái dialog xóa và các handler.
 */
export function useReadingHistory() {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const query = useReadingHistoryQuery();
  const deleteItem = useDeleteHistoryItem();
  const clearAllMutation = useClearHistory();

  const handleClearAll = () => {
    clearAllMutation.mutate();
    setClearDialogOpen(false);
  };

  return {
    historyList: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    deleteItem: (id: string) => deleteItem.mutate(id),
    isDeletingItem: deleteItem.isPending,
    clearAll: handleClearAll,
    isClearingAll: clearAllMutation.isPending,
    clearDialogOpen,
    setClearDialogOpen,
  };
}
