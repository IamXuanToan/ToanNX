"use client";

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { useFinanceRoutes } from "../../../hooks/use-finance-routes";
import { useBulkDeleteInvoices } from "../../../hooks/use-bulk-delete-invoices";
import { useDeleteInvoice } from "../../../hooks/use-delete-invoice";
import { useInvoices } from "../../../hooks/use-invoices";
import { useOwnerFilterOptions } from "../../../hooks/use-owner-filter-options";
import { usePlatformOptions } from "../../../hooks/use-platform-options";
import { INVOICE_PERMISSIONS } from "../../../permissions/invoice-permission";
import type { Invoice } from "../../../types/invoice.types";

/** @returns State bảng hóa đơn (lọc người dùng, năm, loại, nền tảng). */
export function useInvoiceTable() {
  const router = useRouter();
  const routes = useFinanceRoutes();
  const table = useTableState({
    ordering: "-issued_on",
    filterKeys: ["owner", "year", "docType", "platform"],
  });
  const query = useInvoices({
    ...table.filters,
    owner: table.extraFilters.owner,
    year: table.extraFilters.year ? Number(table.extraFilters.year) : undefined,
    docType: table.extraFilters.docType,
    platform: table.extraFilters.platform,
  });
  const platforms = usePlatformOptions();
  const ownerFilter = useOwnerFilterOptions(INVOICE_PERMISSIONS.manageAll);
  const remove = useDeleteInvoice();
  const bulkDelete = useBulkDeleteInvoices();
  return {
    table,
    query,
    canManageAll: ownerFilter.canManageAll,
    canFilterOwner: ownerFilter.canFilterOwner,
    ownerOptions: ownerFilter.ownerOptions,
    yearOptions: Array.from({ length: 6 }, (_, index) => {
      const value = String(new Date().getFullYear() - index);
      return { value, label: value };
    }),
    platformOptions: (platforms.data ?? []).map((platform) => ({
      value: platform.id,
      label: platform.name,
    })),
    view: (invoice: Invoice) => router.push(routes.invoiceDetail(invoice.id)),
    edit: (invoice: Invoice) => router.push(withEditMode(routes.invoiceDetail(invoice.id))),
    remove: (invoice: Invoice) => remove.mutateAsync(invoice.id),
    bulkDelete: (rows: Invoice[]) => bulkDelete.mutateAsync(rows.map((row) => row.id)),
  };
}
