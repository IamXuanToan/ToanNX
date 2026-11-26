/**
 * Component bảng quản trị danh sách tiểu thuyết.
 *
 * Tích hợp chuẩn `DataTable`, tìm kiếm, lọc theo trạng thái, sắp xếp và xóa hàng loạt.
 */

"use client";

import { Eye, Heart } from "lucide-react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { Badge } from "@/shares/components/ui/badge";

import { createBooleanBulkStatus } from "@/shares/lib/bulk-status";
import { NOVEL_ROUTES } from "../../constants/routes";
import type { Novel, NovelStatus } from "../../types/novel.types";
import { useNovelTable } from "./hooks/use-novel-table";

const NOVEL_STATUS_BADGE_VARIANTS: Record<NovelStatus, "default" | "secondary" | "outline"> = {
  ONGOING: "default",
  COMPLETED: "secondary",
  PAUSED: "outline",
};

/**
 * Bảng quản trị danh sách tiểu thuyết: tiêu đề, ảnh bìa, tác giả, trạng thái,
 * số chương, lượt xem, lượt thích, và các thao tác quản trị.
 *
 * @param props - Quyền sửa, quyền xóa.
 * @returns DataTable tiểu thuyết.
 */
export function NovelTable({
  canUpdate = false,
  canDelete = false,
}: {
  canUpdate?: boolean;
  canDelete?: boolean;
}) {
  const t = useTranslations("novel");
  const tPublish = useTranslations("novel.novelForm.fields");
  const format = useFormatter();
  const state = useNovelTable();
  const { table, query } = state;

  const columns: DataTableColumn<Novel>[] = [
    {
      id: "title",
      header: t("admin.table.novel"),
      sortKey: "title",
      mobile: "title",
      className: "md:w-full",
      cell: (novel) => (
        <div className="flex min-w-0 items-center gap-3">
          {novel.thumbnail?.url ? (
            <div className="relative size-10 shrink-0 overflow-hidden rounded border">
              <Image
                src={novel.thumbnail.url}
                alt={novel.title}
                fill
                sizes="40px"
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded border text-xs">
              N/A
            </div>
          )}
          <div className="min-w-0">
            <Link
              href={NOVEL_ROUTES.detail(novel.slug)}
              className="block truncate font-medium hover:underline"
              target="_blank"
            >
              {novel.title}
            </Link>
            <div className="text-muted-foreground truncate text-xs">
              {novel.author?.name || t("admin.unknownAuthor")}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: t("admin.table.status"),
      sortKey: "status",
      cell: (novel) => {
        const status = novel.status || "ONGOING";
        return <Badge variant={NOVEL_STATUS_BADGE_VARIANTS[status]}>{t(`status.${status}`)}</Badge>;
      },
    },
    {
      id: "chaptersCount",
      header: t("admin.table.chapters"),
      cell: (novel) => <span className="font-mono text-sm">{novel.chaptersCount}</span>,
    },
    {
      id: "stats",
      header: t("admin.table.views"),
      cell: (novel) => (
        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" />
            {novel.viewsCount ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="size-3.5 text-rose-500" />
            {novel.favoritesCount ?? 0}
          </span>
        </div>
      ),
    },
    {
      id: "createdAt",
      header: t("admin.table.actions"),
      sortKey: "created_at",
      cell: (novel) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {format.dateTime(new Date(novel.createdAt), {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      tableId="novels"
      columns={columns}
      rows={query.data?.items}
      getRowId={(novel) => novel.id}
      getRowLabel={(novel) => novel.title}
      search={{ ...table.search, placeholder: t("admin.searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <FilterSelect
          label={t("admin.table.status")}
          value={table.getFilterValues("status")}
          onValueChange={(val) => table.setFilterValues("status", val)}
          options={[
            { value: "ONGOING", label: t("status.ONGOING") },
            { value: "COMPLETED", label: t("status.COMPLETED") },
            { value: "PAUSED", label: t("status.PAUSED") },
          ]}
        />
      }
      ordering={table.ordering}
      onOrderingChange={table.onOrderingChange}
      isLoading={query.isPending}
      isFetching={query.isFetching && !query.isPending}
      error={query.isError ? { onRetry: () => query.refetch() } : null}
      empty={{ title: t("admin.noNovels") }}
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
      can={{ update: canUpdate, delete: canDelete }}
      bulkStatus={
        canUpdate
          ? createBooleanBulkStatus(
              { on: tPublish("published"), off: tPublish("draft") },
              state.bulkSetPublished,
            )
          : undefined
      }
      onBulkDelete={canDelete ? state.bulkDelete : undefined}
      aria-label={t("admin.title")}
    />
  );
}
