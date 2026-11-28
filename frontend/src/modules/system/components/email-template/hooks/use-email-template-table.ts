"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { emailTemplateKeys } from "../../../constants/query-keys";
import { SYSTEM_ROUTES } from "../../../constants/routes";
import { useDeleteEmailTemplate } from "../../../hooks/use-delete-email-template";
import { useDuplicateEmailTemplate } from "../../../hooks/use-duplicate-email-template";
import { useEmailTemplates } from "../../../hooks/use-email-templates";
import { emailTemplateService } from "../../../services/email-template.service";
import type { EmailTemplate } from "../../../types/email-template.types";

type RouteContext = "admin" | "portal";

/**
 * State bảng mẫu email: tìm kiếm, lọc phạm vi/nhóm/trạng thái/ngôn ngữ, phân trang URL,
 * xem/sửa/xóa, nhân bản sang bản cá nhân và xóa hàng loạt.
 *
 * @param options - Ngữ cảnh điều hướng (Admin hoặc Portal).
 * @returns State bảng, query và các handler thao tác.
 */
export function useEmailTemplateTable(options?: { routeContext?: RouteContext }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("system.emailTemplates");
  const table = useTableState({
    ordering: "-updated_at",
    filterKeys: ["scope", "category", "status", "locale"],
  });

  const query = useEmailTemplates({
    ...table.filters,
    scope: table.getFilterValues("scope"),
    category: table.getFilterValues("category"),
    status: table.getFilterValues("status"),
    locale: table.getFilterValues("locale"),
    portalOnly: options?.routeContext === "portal" ? true : undefined,
  });

  const remove = useDeleteEmailTemplate();
  const duplicate = useDuplicateEmailTemplate();
  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => emailTemplateService.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
    },
  });

  const getTargetRoute = (id: string) =>
    options?.routeContext === "portal"
      ? { pathname: "/portal/email-templates/[id]" as const, params: { id } }
      : SYSTEM_ROUTES.emailTemplateDetail(id);

  return {
    table,
    query,
    view: (row: EmailTemplate) =>
      router.push(getTargetRoute(row.id) as Parameters<typeof router.push>[0]),
    edit: (row: EmailTemplate) => {
      const route = getTargetRoute(row.id);
      router.push(withEditMode(route) as Parameters<typeof router.push>[0]);
    },
    remove: async (row: EmailTemplate) => {
      await remove.mutateAsync(row.id);
      toast.success(t("deleted"));
    },
    bulkRemove: async (rows: EmailTemplate[]) => {
      await bulkDelete.mutateAsync(rows.map((r) => r.id));
      toast.success(t("bulkDeleted", { count: rows.length }));
    },
    duplicateRow: async (row: EmailTemplate) => {
      const copy = await duplicate.mutateAsync(row.id);
      toast.success(t("duplicated"));
      router.push(withEditMode(getTargetRoute(copy.id)) as Parameters<typeof router.push>[0]);
    },
    isMutating: remove.isPending || bulkDelete.isPending || duplicate.isPending,
  };
}
