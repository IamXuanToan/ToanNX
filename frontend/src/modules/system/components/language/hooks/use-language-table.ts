"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { languageKeys } from "../../../constants/query-keys";
import { SYSTEM_ROUTES } from "../../../constants/routes";
import { useDeleteLanguage } from "../../../hooks/use-delete-language";
import { useLanguages } from "../../../hooks/use-languages";
import { useUpdateLanguage } from "../../../hooks/use-update-language";
import { languageService } from "../../../services/language.service";
import type { LanguageItem } from "../../../types/language.types";

/**
 * State bảng quản lý danh mục Ngôn ngữ: tìm kiếm, lọc bật/tắt, bật/tắt nhanh,
 * thao tác hàng loạt và xem/sửa/xóa.
 *
 * @returns State bảng, query và các handler.
 */
export function useLanguageTable() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("system.languages");
  const table = useTableState({
    ordering: "sort_order",
    filterKeys: ["isActive"],
  });

  const activeRaw = table.getFilterValues("isActive")[0];
  const isActive = activeRaw === "true" ? true : activeRaw === "false" ? false : undefined;

  const query = useLanguages({
    ...table.filters,
    isActive,
  });

  const update = useUpdateLanguage();
  const remove = useDeleteLanguage();
  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => languageService.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: languageKeys.all });
    },
  });
  const bulkStatus = useMutation({
    mutationFn: ({ ids, active }: { ids: string[]; active: boolean }) =>
      languageService.bulkSetActive(ids, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: languageKeys.all });
    },
  });

  return {
    table,
    query,
    view: (row: LanguageItem) => router.push(SYSTEM_ROUTES.languageDetail(row.id)),
    edit: (row: LanguageItem) =>
      router.push(
        withEditMode(SYSTEM_ROUTES.languageDetail(row.id)) as Parameters<typeof router.push>[0],
      ),
    toggleActive: async (row: LanguageItem, nextActive: boolean) => {
      await update.mutateAsync({ id: row.id, input: { isActive: nextActive } });
      toast.success(t("updated"));
    },
    remove: async (row: LanguageItem) => {
      await remove.mutateAsync(row.id);
      toast.success(t("deleted"));
    },
    bulkRemove: async (rows: LanguageItem[]) => {
      await bulkDelete.mutateAsync(rows.map((r) => r.id));
      toast.success(t("bulkDeleted", { count: rows.length }));
    },
    bulkChangeStatus: async (rows: LanguageItem[], value: string) => {
      await bulkStatus.mutateAsync({
        ids: rows.map((r) => r.id),
        active: value === "true",
      });
      toast.success(t("bulkUpdated", { count: rows.length }));
    },
  };
}
