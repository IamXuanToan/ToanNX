"use client";

import type { ComponentProps } from "react";
import { HeartHandshake } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useUsers } from "@/modules/system/hooks/use-users";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { TimestampText } from "@/shares/components/common/timestamp-text";
import { Badge } from "@/shares/components/ui/badge";
import { formatUserDisplayName } from "@/shares/lib/user-display";

import { UTILITIES_ROUTES } from "../../constants/routes";
import type { PageFeedback } from "../../types/page-feedback.types";
import { FeedbackThankDialog } from "./feedback-thank-dialog";
import { usePageFeedbackTable } from "./hooks/use-page-feedback-table";

type RouteContext = "admin" | "portal";

/**
 * Bảng danh sách góp ý / báo lỗi ẩn danh:
 * - Client chỉ xem góp ý trên Custom Page và ShortLink của mình.
 * - Admin (`manage_all`) xem toàn bộ và có thêm bộ lọc theo chủ sở hữu (`owner`).
 * - Hỗ trợ đổi trạng thái hàng loạt, xóa hàng loạt và nút Cảm ơn trực tiếp.
 *
 * @param props - Quyền thao tác, cờ hiện chủ sở hữu và ngữ cảnh điều hướng.
 * @returns Bảng dữ liệu góp ý và dialog cảm ơn.
 */
export function PageFeedbackTable({
  canUpdate,
  canDelete,
  canThank,
  showOwner,
  routeContext = "admin",
}: {
  canUpdate: boolean;
  canDelete: boolean;
  canThank: boolean;
  showOwner: boolean;
  routeContext?: RouteContext;
}) {
  const t = useTranslations("utilities.feedbacks");
  const state = usePageFeedbackTable({ routeContext });
  const { table, query } = state;
  const usersQuery = useUsers({ page: 1, pageSize: 100 });

  const getTargetHref = (id: string): ComponentProps<typeof Link>["href"] =>
    (routeContext === "portal"
      ? { pathname: "/portal/feedbacks/[id]" as const, params: { id } }
      : UTILITIES_ROUTES.pageFeedbackDetail(id)) as ComponentProps<typeof Link>["href"];

  const statusVariant = (status: PageFeedback["status"]) => {
    if (status === "RESOLVED") return "default" as const;
    if (status === "IN_PROGRESS") return "secondary" as const;
    if (status === "IGNORED") return "outline" as const;
    return "destructive" as const;
  };

  const columns: DataTableColumn<PageFeedback>[] = [
    {
      id: "targetTitle",
      header: t("fields.targetTitle"),
      mobile: "title",
      cell: (row) => (
        <div className="min-w-0">
          <Link href={getTargetHref(row.id)} className="font-medium hover:underline">
            {row.targetTitle || t("untitledTarget")}
          </Link>
          <p className="text-muted-foreground max-w-[260px] truncate text-xs">{row.targetUrl}</p>
        </div>
      ),
    },
    {
      id: "feedbackType",
      header: t("fields.feedbackType"),
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="w-fit">
            {t(`types.${row.feedbackType}`)}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {t(`targetTypes.${row.targetType}`)}
          </span>
        </div>
      ),
    },
    {
      id: "message",
      header: t("fields.message"),
      cell: (row) => <p className="line-clamp-2 max-w-[280px] text-sm">{row.message}</p>,
    },
    {
      id: "sender",
      header: t("fields.sender"),
      cell: (row) => (
        <div className="text-xs">
          <p className="font-medium">{row.senderName || t("anonymousSender")}</p>
          <p className="text-muted-foreground">{row.senderEmail || "—"}</p>
        </div>
      ),
    },
    {
      id: "status",
      header: t("fields.status"),
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <Badge variant={statusVariant(row.status)} className="w-fit">
            {t(`statuses.${row.status}`)}
          </Badge>
          {row.thankedAt ? (
            <span className="text-success text-[11px] font-medium">{t("thankedBadge")}</span>
          ) : null}
        </div>
      ),
    },
    ...(showOwner
      ? [
          {
            id: "owner",
            header: t("fields.owner"),
            cell: (row: PageFeedback) =>
              row.targetOwner ? (
                <span className="text-sm">{formatUserDisplayName(row.targetOwner)}</span>
              ) : (
                "—"
              ),
          } satisfies DataTableColumn<PageFeedback>,
        ]
      : []),
    {
      id: "createdAt",
      header: t("fields.createdAt"),
      sortKey: "created_at",
      cell: (row) => <TimestampText value={row.createdAt} />,
    },
  ];

  const ownerOptions = (usersQuery.data?.items ?? []).map((u) => ({
    value: u.id,
    label: formatUserDisplayName(u),
  }));

  return (
    <>
      <DataTable
        tableId="page-feedbacks"
        columns={columns}
        rows={query.data?.items}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.targetTitle || row.targetUrl}
        search={{ ...table.search, placeholder: t("searchPlaceholder") }}
        onClearFilters={table.hasFilters ? table.clearFilters : undefined}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label={t("fields.status")}
              value={table.getFilterValues("status")}
              onValueChange={(values) => table.setFilterValues("status", values)}
              options={[
                { value: "OPEN", label: t("statuses.OPEN") },
                { value: "IN_PROGRESS", label: t("statuses.IN_PROGRESS") },
                { value: "RESOLVED", label: t("statuses.RESOLVED") },
                { value: "IGNORED", label: t("statuses.IGNORED") },
              ]}
            />
            <FilterSelect
              label={t("fields.feedbackType")}
              value={table.getFilterValues("feedbackType")}
              onValueChange={(values) => table.setFilterValues("feedbackType", values)}
              options={[
                { value: "BROKEN_LINK", label: t("types.BROKEN_LINK") },
                { value: "WRONG_INFO", label: t("types.WRONG_INFO") },
                { value: "BUG", label: t("types.BUG") },
                { value: "SUGGESTION", label: t("types.SUGGESTION") },
                { value: "OTHER", label: t("types.OTHER") },
              ]}
            />
            <FilterSelect
              label={t("fields.targetType")}
              value={table.getFilterValues("targetType")}
              onValueChange={(values) => table.setFilterValues("targetType", values)}
              options={[
                { value: "PAGE", label: t("targetTypes.PAGE") },
                { value: "SHORT_LINK", label: t("targetTypes.SHORT_LINK") },
              ]}
            />
            {showOwner ? (
              <FilterSelect
                label={t("fields.owner")}
                value={table.getFilterValues("owner")}
                onValueChange={(values) => table.setFilterValues("owner", values)}
                options={ownerOptions}
              />
            ) : null}
          </div>
        }
        ordering={table.ordering}
        onOrderingChange={table.onOrderingChange}
        isLoading={query.isPending}
        isFetching={query.isFetching && !query.isPending}
        error={query.isError ? { onRetry: () => query.refetch() } : null}
        empty={{ title: t("empty") }}
        onReload={() => query.refetch()}
        pagination={
          query.data
            ? {
                value: query.data.pagination,
                onPageChange: table.onPageChange,
                onPageSizeChange: table.onPageSizeChange,
              }
            : undefined
        }
        onView={state.view}
        onEdit={state.edit}
        onDelete={state.remove}
        can={{
          update: canUpdate,
          delete: canDelete,
        }}
        rowActions={[
          {
            key: "thank",
            label: t("actions.thank"),
            icon: HeartHandshake,
            hidden: (row) => !canThank || !row.senderEmail,
            onClick: (row) => state.setThankTarget(row),
          },
        ]}
        bulkStatus={
          canUpdate
            ? {
                options: [
                  { value: "OPEN", label: t("statuses.OPEN") },
                  { value: "IN_PROGRESS", label: t("statuses.IN_PROGRESS") },
                  { value: "RESOLVED", label: t("statuses.RESOLVED") },
                  { value: "IGNORED", label: t("statuses.IGNORED") },
                ],
                onChange: state.bulkChangeStatus,
              }
            : undefined
        }
        onBulkDelete={canDelete ? state.bulkRemove : undefined}
      />

      <FeedbackThankDialog
        feedback={state.thankTarget}
        open={Boolean(state.thankTarget)}
        onOpenChange={(open) => {
          if (!open) state.setThankTarget(null);
        }}
      />
    </>
  );
}
