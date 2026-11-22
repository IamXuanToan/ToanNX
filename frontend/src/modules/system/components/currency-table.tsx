"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { StatusBadge } from "@/shares/components/common/status-badge";

import { createBooleanBulkStatus } from "@/shares/lib/bulk-status";
import { SYSTEM_ROUTES } from "../constants/routes";
import type { Currency } from "../types/currency.types";
import { useCurrencyTable } from "./hooks/use-currency-table";

/** @param props - Quyền sửa/xóa. @returns Bảng tiền tệ. */
export function CurrencyTable({
  canUpdate,
  canDelete,
}: {
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("system.currencies");
  const tStatus = useTranslations("common.status");
  const state = useCurrencyTable();
  const { table, query } = state;
  const columns: DataTableColumn<Currency>[] = [
    {
      id: "code",
      header: t("fields.code"),
      mobile: "title",
      cell: (row) => (
        <Link
          href={SYSTEM_ROUTES.currencyDetail(row.id)}
          className="hover:text-primary font-medium underline-offset-4 hover:underline"
        >
          {row.code}
        </Link>
      ),
    },
    {
      id: "name",
      header: t("fields.name"),
      className: "md:w-full",
      cell: (row) => `${row.name} (${row.symbol})`,
    },
    {
      id: "decimals",
      header: t("fields.decimalPlaces"),
      align: "end",
      cell: (row) => row.decimalPlaces,
    },
    {
      id: "status",
      header: t("fields.isActive"),
      cell: (row) => (
        <span className="flex gap-1">
          {row.isBase ? <StatusBadge tone="info">{t("base")}</StatusBadge> : null}
          <StatusBadge tone={row.isActive ? "success" : "neutral"}>
            {row.isActive ? tStatus("active") : tStatus("inactive")}
          </StatusBadge>
        </span>
      ),
    },
  ];
  return (
    <DataTable
      tableId="system-currencies"
      columns={columns}
      rows={query.data?.items}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.code}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
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
      canSelectRow={(row) => !row.isBase}
      canDeleteRow={(row) => !row.isBase}
      aria-label={t("title")}
    />
  );
}
