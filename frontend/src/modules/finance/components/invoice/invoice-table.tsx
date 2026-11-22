"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";

import { DOC_TYPES } from "../../constants/finance-enums";
import { FINANCE_ROUTES } from "../../constants/routes";
import type { Invoice } from "../../types/invoice.types";
import { useInvoiceTable } from "./hooks/use-invoice-table";
import { MoneyText } from "../income/money-text";

/** @param props - Quyền sửa/xóa. @returns Bảng hóa đơn / chứng từ. */
export function InvoiceTable({ canUpdate, canDelete }: { canUpdate: boolean; canDelete: boolean }) {
  const t = useTranslations("finance.invoices");
  const format = useFormatter();
  const state = useInvoiceTable();
  const { table, query } = state;
  const columns: DataTableColumn<Invoice>[] = [
    {
      id: "issuer",
      header: t("fields.issuer"),
      mobile: "title",
      className: "md:w-full",
      cell: (invoice) => (
        <Link
          href={FINANCE_ROUTES.invoiceDetail(invoice.id)}
          className="hover:text-primary font-medium underline-offset-4 hover:underline"
        >
          {invoice.issuer}
          {invoice.number ? (
            <span className="text-muted-foreground"> · {invoice.number}</span>
          ) : null}
        </Link>
      ),
    },
    {
      id: "docType",
      header: t("fields.docType"),
      cell: (invoice) => t(`docType.${invoice.docType}`),
    },
    {
      id: "issuedOn",
      header: t("fields.issuedOn"),
      sortKey: "issued_on",
      cell: (invoice) => format.dateTime(new Date(invoice.issuedOn), { dateStyle: "short" }),
    },
    {
      id: "platform",
      header: t("fields.platform"),
      hideBelow: "lg",
      cell: (invoice) => invoice.platformName ?? "—",
    },
    {
      id: "amount",
      header: t("fields.originalAmount"),
      align: "end",
      cell: (invoice) => (
        <MoneyText
          value={invoice.originalAmount}
          currency={invoice.currencyCode}
          decimals={invoice.currencyDecimalPlaces}
        />
      ),
    },
    {
      id: "tax",
      header: t("fields.originalTaxAmount"),
      align: "end",
      hideBelow: "lg",
      cell: (invoice) => (
        <MoneyText
          value={invoice.originalTaxAmount}
          currency={invoice.currencyCode}
          decimals={invoice.currencyDecimalPlaces}
        />
      ),
    },
    {
      id: "links",
      header: t("fields.links"),
      align: "end",
      hideBelow: "xl",
      cell: (invoice) => `${invoice.incomeIds.length} · ${invoice.attachments.length}`,
    },
  ];
  return (
    <DataTable
      tableId="finance-invoices"
      columns={columns}
      rows={query.data?.items}
      getRowId={(invoice) => invoice.id}
      getRowLabel={(invoice) => invoice.issuer}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          <FilterSelect
            label={t("fields.docType")}
            value={table.getFilterValues("docType")}
            onValueChange={(values) => table.setFilterValues("docType", values)}
            options={DOC_TYPES.map((type) => ({ value: type, label: t(`docType.${type}`) }))}
          />
          <FilterSelect
            label={t("fields.platform")}
            value={table.getFilterValues("platform")}
            onValueChange={(values) => table.setFilterValues("platform", values)}
            options={state.platformOptions}
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
      onView={state.view}
      onEdit={state.edit}
      onDelete={state.remove}
      can={{ update: canUpdate, delete: canDelete }}
      onBulkDelete={canDelete ? state.bulkDelete : undefined}
      aria-label={t("title")}
    />
  );
}
