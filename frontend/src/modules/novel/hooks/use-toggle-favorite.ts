/**
 * Hook xử lý thêm hoặc gỡ một tiểu thuyết khỏi danh sách yêu thích.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { novelKeys } from "../constants/query-keys";
import { favoriteService } from "../services/favorite.service";

/** Tham số thực hiện thao tác bật/tắt yêu thích tiểu thuyết. */
export type ToggleFavoriteVariables =
  | string
  | {
      /** ID của tiểu thuyết */
      novelId: string;
      /** Slug của tiểu thuyết (nếu có để làm tươi cache chi tiết) */
      novelSlug?: string;
    };

/**
 * Hook xử lý thêm hoặc gỡ một tiểu thuyết khỏi danh sách yêu thích.
 *
 * Tự động hiển thị toast thông báo thành công / thất bại và làm tươi cache danh sách
 * yêu thích cùng cache chi tiết tiểu thuyết tương ứng.
 *
 * @returns Mutation object cung cấp hàm `mutate` và trạng thái `isPending`.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const errorMessage = useApiErrorMessage();
  const t = useTranslations("novel.toast");

  return useMutation<{ isFavorited: boolean }, Error, ToggleFavoriteVariables>({
    mutationFn: (variables) => {
      const novelId = typeof variables === "string" ? variables : variables.novelId;
      return favoriteService.toggleFavorite(novelId);
    },
    onSuccess: (data, variables) => {
      if (data.isFavorited) {
        toast.success(t("favoriteAdded"));
      } else {
        toast.info(t("favoriteRemoved"));
      }
      queryClient.invalidateQueries({ queryKey: novelKeys.favorites() });
      const slug = typeof variables === "string" ? undefined : variables.novelSlug;
      if (slug) {
        queryClient.invalidateQueries({
          queryKey: novelKeys.clientNovel(slug),
        });
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}
