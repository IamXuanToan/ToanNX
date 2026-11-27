"use client";

import { Calculator, Download, ScanSearch } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { env } from "@/shares/config/env";
import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { StatusBadge } from "@/shares/components/common/status-badge";
import { TimestampText } from "@/shares/components/common/timestamp-text";
import { Button } from "@/shares/components/ui/button";
import { DEFAULT_CURRENCY } from "@/shares/constants/currency";
import { formatOwnerDisplayName, formatOwnerDisplayTooltip } from "@/shares/lib/user-display";

import { FINANCE_API_ENDPOINTS } from "../../constants/api-endpoints";
import { INCOME_SOURCES, TAX_STATUSES } from "../../constants/finance-enums";
import { useFinanceRoutes } from "../../hooks/use-finance-routes";
import type { Income, IncomeFilters } from "../../types/income.types";
import { useIncomeTable } from "./hooks/use-income-table";
import { MoneyText } from "./money-text";
import { TaxStatusBadge } from "./tax-status-badge";

/** Query string CSV theo đúng bộ lọc (snake_case như BE). */
function exportHref(filters: IncomeFilters): string {
  const params = new URLSearchParams();
  const map: Record<string, unknown> = {
    year: filters.year,
    month: filters.month,
    owner: filters.owner,
    platform: filters.platform,
    tax_status: filters.taxStatus,
    source: filters.source,
    currency: filters.currency,
    needs_review: filters.needsReview,
    has_invoice: filters.hasInvoice,
    search: filters.search,
  };
  for (const [key, value] of Object.entries(map))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return `${env.apiBaseUrl}${FINANCE_API_ENDPOINTS.incomeExport}?${params.toString()}`;
}

/**
 * Bảng giao dịch thu nhập: ngày, nền tảng, nội dung, số gốc + tỷ giá, VNĐ, khấu trừ (%/tiền thuế), trạng
 * thái, chứng từ; hàng loạt nhận diện lại / tính lại khấu trừ / xóa; xuất CSV.
 *
 * @param props - Quyền, bộ lọc cố định (báo cáo).
 * @returns Bảng.
 */
export function IncomeTable({
  canUpdate,
  canDelete,
  scope,
  tableId = "finance-incomes",
}: {
  canUpdate: boolean;
  canDelete: boolean;
  scope?: IncomeFilters;
  tableId?: string;
}) {
  const t = useTranslations("finance.incomes");
  const tTax = useTranslations("finance.taxStatus");
  const routes = useFinanceRoutes();
  const state = useIncomeTable(scope);
  const { table, query } = state;
  const columns: DataTableColumn<Income>[] = [
    {
      id: "receivedAt",
      header: t("fields.receivedAt"),
      sortKey: "received_at",
      mobile: "title",
      cell: (income) => (
        <Link
          href={routes.incomeDetail(income.id)}
          className="hover:text-primary font-medium underline-offset-4 hover:underline"
        >
          <TimestampText value={income.receivedAt} />
        </Link>
      ),
    },
    {
      id: "platform",
      header: t("fields.platform"),
      cell: (income) =>
        income.platformName ?? <StatusBadge tone="warning">{tTax("UNCLASSIFIED")}</StatusBadge>,
    },
    ...(state.canManageAll
      ? [
          {
            id: "owner",
            header: t("fields.owner"),
            hideBelow: "xl" as const,
            cell: (income: Income) => {
              const ownerLabel = formatOwnerDisplayName(income);
              return (
                <AppTooltip content={formatOwnerDisplayTooltip(income)}>
                  <span className="text-muted-foreground block max-w-44 truncate">
                    {ownerLabel || "—"}
                  </span>
                </AppTooltip>
              );
            },
          },
        ]
      : []),
    {
      id: "content",
      header: t("fields.content"),
      className: "md:w-full",
      hideBelow: "lg",
      cell: (income) => (
        <AppTooltip content={income.content}>
          <span className="text-muted-foreground block max-w-80 truncate">{income.content}</span>
        </AppTooltip>
      ),
    },
    {
      id: "original",
      header: t("fields.originalAmount"),
      align: "end",
      hideBelow: "xl",
      cell: (income) =>
        income.currencyCode === DEFAULT_CURRENCY ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <AppTooltip
            content={t("rateTooltip", {
              rate: Number(income.exchangeRate),
              source: t(`rateSource.${income.rateSource}`),
            })}
          >
            <span>
              <MoneyText
                value={income.originalAmount}
                currency={income.currencyCode}
                decimals={income.currencyDecimalPlaces}
              />
            </span>
          </AppTooltip>
        ),
    },
    {
      id: "amount",
      header: t("fields.amount"),
      sortKey: "amount",
      align: "end",
      cell: (income) =>
        income.amountStatus === "UNKNOWN" ? (
          <StatusBadge tone="warning">{t("unknownAmount")}</StatusBadge>
        ) : (
          <MoneyText value={income.amount} className="font-medium" />
        ),
    },
    {
      id: "taxAmount",
      header: t("fields.taxAmount"),
      align: "end",
      cell: (income) => <MoneyText value={income.taxWithheld ? income.taxAmount : null} />,
    },
    {
      id: "taxStatus",
      header: t("fields.taxStatus"),
      cell: (income) => (
        <span className="flex flex-wrap gap-1">
          <TaxStatusBadge status={income.taxStatus} rate={income.taxRate} />
          {income.isTaxManual ? <StatusBadge tone="info">{t("manualTax")}</StatusBadge> : null}
          {income.invoiceIds.length ? (
            <StatusBadge tone="neutral">{t("hasInvoice")}</StatusBadge>
          ) : null}
        </span>
      ),
    },
  ];
  return (
    <DataTable
      tableId={tableId}
      columns={columns}
      rows={query.data?.items}
      getRowId={(income) => income.id}
      getRowLabel={(income) => income.content || income.receivedDate}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          {state.canFilterOwner && !scope?.owner ? (
            <FilterSelect
              label={t("fields.owner")}
              value={table.getFilterValues("owner")}
              onValueChange={(values) => table.setFilterValues("owner", values)}
              options={state.ownerOptions}
            />
          ) : null}
          {!scope?.year ? (
            <FilterSelect
              label={t("filters.year")}
              value={table.getFilterValues("year")}
              onValueChange={(values) => table.setFilterValues("year", values.slice(-1))}
              options={state.yearOptions}
            />
          ) : null}
          <FilterSelect
            label={t("fields.platform")}
            value={table.getFilterValues("platform")}
            onValueChange={(values) => table.setFilterValues("platform", values)}
            options={state.platformOptions}
          />
          <FilterSelect
            label={t("fields.taxStatus")}
            value={table.getFilterValues("taxStatus")}
            onValueChange={(values) => table.setFilterValues("taxStatus", values)}
            options={TAX_STATUSES.map((status) => ({ value: status, label: tTax(status) }))}
          />
          <FilterSelect
            label={t("fields.source")}
            value={table.getFilterValues("source")}
            onValueChange={(values) => table.setFilterValues("source", values)}
            options={INCOME_SOURCES.map((source) => ({
              value: source,
              label: t(`source.${source}`),
            }))}
          />
          <FilterSelect
            label={t("filters.review")}
            value={table.getFilterValues("needsReview")}
            onValueChange={(values) => table.setFilterValues("needsReview", values.slice(-1))}
            options={[{ value: "true", label: t("filters.needsReview") }]}
          />
          <FilterSelect
            label={t("filters.invoice")}
            value={table.getFilterValues("hasInvoice")}
            onValueChange={(values) => table.setFilterValues("hasInvoice", values.slice(-1))}
            options={[
              { value: "true", label: t("filters.withInvoice") },
              { value: "false", label: t("filters.withoutInvoice") },
            ]}
          />
        </>
      }
      toolbar={
        <Button type="button" variant="outline" asChild>
          <Link href={exportHref(state.filters) as never}>
            <Download />
            {t("actions.export")}
          </Link>
        </Button>
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
      bulkActions={
        canUpdate
          ? [
              {
                key: "reclassify",
                label: t("actions.reclassify"),
                icon: ScanSearch,
                onClick: state.reclassify,
              },
              {
                key: "recalculate",
                label: t("actions.recalculate"),
                icon: Calculator,
                onClick: state.recalculate,
              },
            ]
          : undefined
      }
      aria-label={t("title")}
    />
  );
}
