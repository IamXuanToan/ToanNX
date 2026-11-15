"use client";

import { ExternalLink } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table/types";
import { FilterSelect } from "@/shares/components/common/filter-select/filter-select";
import { StatusBadge } from "@/shares/components/common/status-badge/status-badge";

import { CUSTOM_PAGES_ROUTES } from "../../constants/routes";
import { PAGE_STATUSES, type Page } from "../../types/custom-pages.types";
import { usePageTable } from "./hooks/use-page-table";

const STATUS_TONE = { DRAFT: "neutral", PUBLISHED: "success", UNPUBLISHED: "warning" } as const;

/**
 * Bảng trang: tiêu đề + URL công khai, đường dẫn giữa, trạng thái, chủ sở hữu (khi xem được của mọi người),
 * cập nhật; Sửa, Sao chép (nhân bản), Xóa, Xem; hàng loạt công khai/ngừng công khai/xóa.
 *
 * @param props - Quyền tạo/sửa/xóa và có hiện cột chủ sở hữu.
 * @returns Bảng.
 */
export function PageTable({
  canCreate,
  canUpdate,
  canDelete,
  showOwner,
}: {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  showOwner: boolean;
}) {
  const t = useTranslations("customPages.pages");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const state = usePageTable();
  const { table, query } = state;

  const columns: DataTableColumn<Page>[] = [
    {
      id: "title",
      header: t("columns.title"),
      sortKey: "title",
      mobile: "title",
      className: "md:w-full",
      cell: (page) => (
        <div className="min-w-0">
          <Link
            href={CUSTOM_PAGES_ROUTES.pageDetail(page.id)}
            className="hover:text-primary block truncate font-medium underline-offset-4 hover:underline"
          >
            {page.title}
          </Link>
          <p className="text-muted-foreground truncate text-xs">
            {page.publicUrl.replace(/^https?:\/\//, "")}
          </p>
        </div>
      ),
    },
    { id: "path", header: t("columns.path"), cell: (page) => <span>/{page.path.segment}</span> },
    {
      id: "status",
      header: t("columns.status"),
      sortKey: "status",
      cell: (page) => (
        <StatusBadge tone={STATUS_TONE[page.status]}>{t(`statuses.${page.status}`)}</StatusBadge>
      ),
    },
    ...(showOwner
      ? [
          {
            id: "owner",
            header: t("columns.owner"),
            hideBelow: "xl" as const,
            cell: (page: Page) => (
              <span className="text-muted-foreground truncate">
                {page.owner.fullName || page.owner.email}
              </span>
            ),
          },
        ]
      : []),
    {
      id: "updatedAt",
      header: t("columns.updatedAt"),
      sortKey: "updated_at",
      hideBelow: "lg",
      cell: (page) => (
        <span className="text-muted-foreground">
          {format.relativeTime(new Date(page.updatedAt), now)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      tableId="custom-pages"
      columns={columns}
      rows={query.data?.items}
      getRowId={(page) => page.id}
      getRowLabel={(page) => page.title}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          <FilterSelect
            label={t("columns.path")}
            value={table.getFilterValues("path")}
            onValueChange={(values) => table.setFilterValues("path", values)}
            options={(state.paths.data ?? []).map((path) => ({
              value: path.id,
              label: `/${path.segment}`,
            }))}
          />
          <FilterSelect
            label={t("columns.status")}
            value={table.getFilterValues("status")}
            onValueChange={(values) => table.setFilterValues("status", values)}
            options={PAGE_STATUSES.map((status) => ({
              value: status,
              label: t(`statuses.${status}`),
            }))}
          />
        </>
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
      onEdit={canUpdate ? state.edit : undefined}
      onCopy={canCreate ? (page) => void state.duplicate(page) : undefined}
      onDelete={canDelete ? state.remove : undefined}
      rowActions={[
        {
          key: "view",
          label: t("view"),
          icon: ExternalLink,
          onClick: (page) => window.open(page.publicUrl, "_blank", "noopener,noreferrer"),
        },
      ]}
      bulkStatus={
        canUpdate
          ? {
              options: PAGE_STATUSES.map((status) => ({
                value: status,
                label: t(`statuses.${status}`),
              })),
              onChange: (pages, value) => state.bulkSetStatus(pages, value as Page["status"]),
            }
          : undefined
      }
      onBulkDelete={canDelete ? state.bulkRemove : undefined}
      aria-label={t("title")}
    />
  );
}
