/**
 * Hook mutation nhập khẩu (import) tiểu thuyết hàng loạt từ file/dữ liệu JSON.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { novelKeys } from "../constants/query-keys";
import { novelService } from "../services/novel.service";
import type { NovelImportPayload, NovelImportResult } from "../types/novel-import.types";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook import tiểu thuyết kèm danh sách chương.
 *
 * Tự động vô hiệu hóa cache danh sách truyện và hiển thị toast thông báo.
 *
 * @param onSuccessCallback - Callback được gọi khi nhập khẩu thành công.
 * @returns Mutation controls cho thao tác import truyện.
 */
export function useImportNovel(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const t = useTranslations("novel");

  return useMutation<NovelImportResult, Error, NovelImportPayload>({
    mutationFn: (payload: NovelImportPayload) => novelService.importNovel(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: novelKeys.novel.all });
      toast.success(
        t("toast.importSuccess", { title: result.novelTitle, count: result.chaptersCount }),
      );
      onSuccessCallback?.();
    },
    onError: (error) => {
      toast.error(error.message || t("errors.novel_import_invalid_data"));
    },
  });
}
