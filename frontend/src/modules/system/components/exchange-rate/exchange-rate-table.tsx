"use client";

import { useFormatter, useTranslations } from "next-intl";

import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { StatusBadge } from "@/shares/components/common/status-badge";

import type { ExchangeRate } from "../../types/currency.types";
import { useExchangeRateTable } from "./hooks/use-exchange-rate-table";

const SOURCES = ["VIETCOMBANK_TRANSFER_BUY", "MANUAL"] as const;

/** @param props - Quyền xóa (chỉ dòng nhập tay). @returns Bảng tỷ giá. */
export function ExchangeRateTable({ canDelete }: { canDelete: boolean }) {
  const t = useTranslations("system.exchangeRates");
  const format = useFormatter();
  const state = useExchangeRateTable();
  const { table, query } = state;
  const columns: DataTableColumn<ExchangeRate>[] = [
    {
      id: "date",
      header: t("fields.rateDate"),
      sortKey: "rate_date",
      mobile: "title",
      cell: (row) => format.dateTime(new Date(row.rateDate), { dateStyle: "medium" }),
    },
    { id: "currency", header: t("fields.currency"), cell: (row) => row.currencyCode },
    {
      id: "rate",
      header: t("fields.rate"),
      align: "end",
      cell: (row) => format.number(Number(row.rate)),
    },
    {
      id: "source",
      header: t("fields.source"),
      cell: (row) => (
        <StatusBadge tone={row.source === "MANUAL" ? "info" : "neutral"}>
          {t(`source.${row.source}`)}
        </StatusBadge>
      ),
    },
    {
      id: "note",
      header: t("fields.note"),
      className: "md:w-full",
      hideBelow: "lg",
      cell: (row) => <span className="text-muted-foreground">{row.note}</span>,
    },
  ];
  return (
    <DataTable
      tableId="system-exchange-rates"
      columns={columns}
      rows={query.data?.items}
      getRowId={(row) => row.id}
      getRowLabel={(row) => `${row.currencyCode} ${row.rateDate}`}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          <FilterSelect
            label={t("fields.currency")}
            value={table.getFilterValues("currency")}
            onValueChange={(values) => table.setFilterValues("currency", values)}
            options={state.currencyOptions}
          />
          <FilterSelect
            label={t("fields.source")}
            value={table.getFilterValues("source")}
            onValueChange={(values) => table.setFilterValues("source", values)}
            options={SOURCES.map((source) => ({ value: source, label: t(`source.${source}`) }))}
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
      onDelete={state.remove}
      can={{ delete: canDelete }}
      onBulkDelete={canDelete ? state.bulkDelete : undefined}
      canSelectRow={(row) => row.source === "MANUAL"}
      canDeleteRow={(row) => row.source === "MANUAL"}
      aria-label={t("title")}
    />
  );
}
