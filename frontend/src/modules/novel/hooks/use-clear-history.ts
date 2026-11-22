"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { novelKeys } from "../constants/query-keys";
import { readingHistoryService } from "../services/reading-history.service";

/**
 * Hook xử lý xóa toàn bộ lịch sử đọc tiểu thuyết của người dùng hiện tại.
 *
 * Tự động hiển thị toast và làm sạch cache danh sách lịch sử đọc khi hoàn tất.
 *
 * @returns Mutation object cho thao tác dọn sạch toàn bộ lịch sử đọc.
 */
export function useClearHistory() {
  const queryClient = useQueryClient();
  const errorMessage = useApiErrorMessage();
  const t = useTranslations("novel.toast");

  return useMutation({
    mutationFn: () => readingHistoryService.clearAllHistory(),
    onSuccess: () => {
      toast.success(t("historyCleared"));
      queryClient.invalidateQueries({ queryKey: novelKeys.readingHistory() });
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}
