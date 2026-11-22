"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { TableStatusSwitch } from "@/shares/components/common/table-status-switch";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";

import { createBooleanBulkStatus } from "@/shares/lib/bulk-status";
import { UTILITIES_ROUTES } from "../constants/routes";
import type { PagePath } from "../types/page-path.types";
import { usePagePathTable } from "./hooks/use-page-path-table";

/**
 * Bảng đường dẫn giữa: segment + tên, số trang, thứ tự, bật/tắt; Sửa, Xóa (chỉ khi không còn trang).
 *
 * @param props - Quyền sửa/xóa.
 * @returns Bảng.
 */
export function PagePathTable({
  canUpdate,
  canDelete,
}: {
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("utilities.customPages.paths");
  const tStatus = useTranslations("common.status");
  const state = usePagePathTable();
  const { table, query } = state;

  const columns: DataTableColumn<PagePath>[] = [
    {
      id: "segment",
      header: t("columns.segment"),
      sortKey: "segment",
      mobile: "title",
      className: "md:w-full",
      cell: (path) => (
        <div className="min-w-0">
          <Link
            href={UTILITIES_ROUTES.pagePathDetail(path.id)}
            className="hover:text-primary block truncate font-medium underline-offset-4 hover:underline"
          >
            /{path.segment}
          </Link>
          <p className="text-muted-foreground truncate text-xs">{path.name}</p>
        </div>
      ),
    },
    {
      id: "pageCount",
      header: t("columns.pageCount"),
      sortKey: "page_count",
      align: "end",
      cell: (path) => path.pageCount,
    },
    {
      id: "position",
      header: t("columns.position"),
      sortKey: "position",
      align: "end",
      cell: (path) => path.position,
    },
    {
      id: "status",
      header: t("columns.status"),
      cell: (path) => (
        <TableStatusSwitch
          checked={path.isActive}
          onLabel={tStatus("active")}
          offLabel={t("inactive")}
          aria-label={path.isActive ? t("actions.disable") : t("actions.enable")}
          onCheckedChange={canUpdate ? (checked) => state.setActive(path, checked) : undefined}
        />
      ),
    },
  ];

  return (
    <DataTable
      tableId="custom-page-paths"
      columns={columns}
      rows={query.data?.items}
      getRowId={(path) => path.id}
      getRowLabel={(path) => `/${path.segment}`}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <FilterSelect
          label={t("columns.status")}
          value={table.getFilterValues("isActive")}
          onValueChange={(values) => table.setFilterValues("isActive", values)}
          options={[
            { value: "true", label: tStatus("active") },
            { value: "false", label: t("inactive") },
          ]}
        />
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
      can={{ update: canUpdate, delete: canDelete }}
      onBulkDelete={canDelete ? state.bulkDelete : undefined}
      bulkStatus={
        canUpdate
          ? createBooleanBulkStatus(
              { on: tStatus("active"), off: tStatus("inactive") },
              state.bulkSetActive,
            )
          : undefined
      }
      canDeleteRow={(path) => path.pageCount === 0}
      aria-label={t("title")}
    />
  );
}
