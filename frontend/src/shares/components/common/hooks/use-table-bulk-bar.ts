"use client";

import { useState } from "react";

import type { DataTableBulkAction } from "../data-table.types";

/**
 * Hook quản lý trạng thái xử lý hàng loạt, hộp thoại xác nhận và thực thi tác vụ của TableBulkBar.
 *
 * @param selectedRows - Danh sách dòng được chọn.
 * @param onClearSelection - Hàm xóa vùng chọn.
 * @returns Trạng thái xác nhận xóa, action đang chờ, cờ đang xử lý và các hàm điều khiển.
 */
export function useTableBulkBar<T>({
  selectedRows,
  onClearSelection,
}: {
  selectedRows: T[];
  onClearSelection: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<DataTableBulkAction<T> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const count = selectedRows.length;

  const run = async (task: () => unknown) => {
    setIsProcessing(true);
    try {
      await task();
      setConfirmOpen(false);
      setPendingAction(null);
      onClearSelection();
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    confirmOpen,
    setConfirmOpen,
    pendingAction,
    setPendingAction,
    isProcessing,
    count,
    run,
  };
}
