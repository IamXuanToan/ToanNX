"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { novelKeys } from "../constants/query-keys";
import { readingHistoryService } from "../services/reading-history.service";

/**
 * Hook xử lý xóa một mục lịch sử đọc cụ thể của người dùng.
 *
 * Tự động hiển thị toast và làm tươi cache danh sách lịch sử đọc khi hoàn tất.
 *
 * @returns Mutation object nhận `id` của bản ghi lịch sử cần xóa.
 */
export function useDeleteHistoryItem() {
  const queryClient = useQueryClient();
  const errorMessage = useApiErrorMessage();
  const t = useTranslations("novel.toast");

  return useMutation({
    mutationFn: (id: string) => readingHistoryService.deleteHistoryItem(id),
    onSuccess: () => {
      toast.success(t("historyDeleted"));
      queryClient.invalidateQueries({ queryKey: novelKeys.readingHistory() });
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}
