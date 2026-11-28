"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { pageFeedbackKeys } from "../../../constants/query-keys";
import { UTILITIES_ROUTES } from "../../../constants/routes";
import { useDeletePageFeedback } from "../../../hooks/use-delete-page-feedback";
import { usePageFeedbacks } from "../../../hooks/use-page-feedbacks";
import { pageFeedbackService } from "../../../services/page-feedback.service";
import type { PageFeedback, PageFeedbackStatus } from "../../../types/page-feedback.types";

type RouteContext = "admin" | "portal";

/**
 * State bảng góp ý / báo lỗi ẩn danh: tìm kiếm, lọc trạng thái/loại/đối tượng/chủ sở hữu (Admin),
 * cập nhật trạng thái hàng loạt, xóa hàng loạt và mở dialog cảm ơn.
 *
 * @param options - Ngữ cảnh điều hướng (Admin hoặc Portal).
 * @returns State bảng, query và các handler.
 */
export function usePageFeedbackTable(options?: { routeContext?: RouteContext }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("utilities.feedbacks");
  const [thankTarget, setThankTarget] = useState<PageFeedback | null>(null);

  const table = useTableState({
    ordering: "-created_at",
    filterKeys: ["status", "feedbackType", "targetType", "thanked", "owner"],
  });

  const thankedRaw = table.getFilterValues("thanked")[0];
  const thanked = thankedRaw === "true" ? true : thankedRaw === "false" ? false : undefined;

  const query = usePageFeedbacks({
    ...table.filters,
    status: table.getFilterValues("status"),
    feedbackType: table.getFilterValues("feedbackType"),
    targetType: table.getFilterValues("targetType"),
    owner: table.getFilterValues("owner"),
    thanked,
  });

  const remove = useDeletePageFeedback();
  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => pageFeedbackService.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageFeedbackKeys.all });
    },
  });
  const bulkStatus = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: PageFeedbackStatus }) =>
      pageFeedbackService.bulkUpdateStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageFeedbackKeys.all });
    },
  });

  const getTargetRoute = (id: string) =>
    options?.routeContext === "portal"
      ? { pathname: "/portal/feedbacks/[id]" as const, params: { id } }
      : UTILITIES_ROUTES.pageFeedbackDetail(id);

  return {
    table,
    query,
    thankTarget,
    setThankTarget,
    view: (row: PageFeedback) =>
      router.push(getTargetRoute(row.id) as Parameters<typeof router.push>[0]),
    edit: (row: PageFeedback) => {
      const route = getTargetRoute(row.id);
      router.push(withEditMode(route) as Parameters<typeof router.push>[0]);
    },
    remove: async (row: PageFeedback) => {
      await remove.mutateAsync(row.id);
      toast.success(t("deleted"));
    },
    bulkRemove: async (rows: PageFeedback[]) => {
      await bulkDelete.mutateAsync(rows.map((r) => r.id));
      toast.success(t("bulkDeleted", { count: rows.length }));
    },
    bulkChangeStatus: async (rows: PageFeedback[], status: string) => {
      await bulkStatus.mutateAsync({
        ids: rows.map((r) => r.id),
        status: status as PageFeedbackStatus,
      });
      toast.success(t("bulkUpdated", { count: rows.length }));
    },
  };
}
