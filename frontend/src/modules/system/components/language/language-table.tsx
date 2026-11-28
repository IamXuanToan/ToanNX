"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { TableStatusSwitch } from "@/shares/components/common/table-status-switch";
import { TimestampText } from "@/shares/components/common/timestamp-text";
import { Badge } from "@/shares/components/ui/badge";

import { SYSTEM_ROUTES } from "../../constants/routes";
import type { LanguageItem } from "../../types/language.types";
import { useLanguageTable } from "./hooks/use-language-table";

/**
 * Bảng quản trị danh mục Ngôn ngữ: mã, tên, tên phụ, thứ tự, công tắc bật/tắt,
 * thao tác hàng loạt bật/tắt và xóa (chặn xóa ngôn ngữ mặc định).
 *
 * @param props - Quyền sửa và xóa.
 * @returns Bảng danh mục ngôn ngữ.
 */
export function LanguageTable({
  canUpdate,
  canDelete,
}: {
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("system.languages");
  const tStatus = useTranslations("common.status");
  const state = useLanguageTable();
  const { table, query } = state;

  const columns: DataTableColumn<LanguageItem>[] = [
    {
      id: "name",
      header: t("fields.name"),
      sortKey: "name",
      mobile: "title",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="text-lg" aria-hidden="true">
            {row.flagEmoji || "🌐"}
          </span>
          <div className="min-w-0">
            <Link
              href={SYSTEM_ROUTES.languageDetail(row.id)}
              className="font-medium hover:underline"
            >
              {row.name}
            </Link>
            <p className="text-muted-foreground font-mono text-xs uppercase">{row.code}</p>
          </div>
        </div>
      ),
    },
    {
      id: "nativeName",
      header: t("fields.nativeName"),
      cell: (row) => <span className="text-sm">{row.nativeName || "—"}</span>,
    },
    {
      id: "sortOrder",
      header: t("fields.sortOrder"),
      sortKey: "sort_order",
      align: "end",
      cell: (row) => <span className="font-mono text-sm tabular-nums">{row.sortOrder}</span>,
    },
    {
      id: "isDefault",
      header: t("fields.isDefault"),
      cell: (row) => (row.isDefault ? <Badge variant="secondary">{t("defaultBadge")}</Badge> : "—"),
    },
    {
      id: "isActive",
      header: t("fields.isActive"),
      cell: (row) => (
        <TableStatusSwitch
          checked={row.isActive}
          onLabel={tStatus("active")}
          offLabel={tStatus("inactive")}
          aria-label={row.name}
          onCheckedChange={
            canUpdate && !row.isDefault ? (checked) => state.toggleActive(row, checked) : undefined
          }
        />
      ),
    },
    {
      id: "updatedAt",
      header: t("fields.updatedAt"),
      sortKey: "updated_at",
      cell: (row) => <TimestampText value={row.updatedAt} />,
    },
  ];

  return (
    <DataTable
      tableId="system-languages"
      columns={columns}
      rows={query.data?.items}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.name}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <FilterSelect
          label={t("fields.isActive")}
          value={table.getFilterValues("isActive")}
          onValueChange={(values) => table.setFilterValues("isActive", values)}
          options={[
            { value: "true", label: tStatus("active") },
            { value: "false", label: tStatus("inactive") },
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
      can={{
        update: canUpdate,
        delete: canDelete,
      }}
      bulkStatus={
        canUpdate
          ? {
              options: [
                { value: "true", label: tStatus("active") },
                { value: "false", label: tStatus("inactive") },
              ],
              onChange: state.bulkChangeStatus,
            }
          : undefined
      }
      onBulkDelete={canDelete ? state.bulkRemove : undefined}
    />
  );
}
