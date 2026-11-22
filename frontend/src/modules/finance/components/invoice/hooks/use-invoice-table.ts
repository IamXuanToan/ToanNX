"use client";

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { FINANCE_ROUTES } from "../../../constants/routes";
import { useBulkDeleteInvoices } from "../../../hooks/use-bulk-delete-invoices";
import { useDeleteInvoice } from "../../../hooks/use-delete-invoice";
import { useInvoices } from "../../../hooks/use-invoices";
import { usePlatformOptions } from "../../../hooks/use-platform-options";
import type { Invoice } from "../../../types/invoice.types";

/** @returns State bảng hóa đơn (lọc loại, nền tảng). */
export function useInvoiceTable() {
  const router = useRouter();
  const table = useTableState({ ordering: "-issued_on", filterKeys: ["docType", "platform"] });
  const query = useInvoices({
    ...table.filters,
    docType: table.extraFilters.docType,
    platform: table.extraFilters.platform,
  });
  const platforms = usePlatformOptions();
  const remove = useDeleteInvoice();
  const bulkDelete = useBulkDeleteInvoices();
  return {
    table,
    query,
    platformOptions: (platforms.data ?? []).map((platform) => ({
      value: platform.id,
      label: platform.name,
    })),
    view: (invoice: Invoice) => router.push(FINANCE_ROUTES.invoiceDetail(invoice.id)),
    edit: (invoice: Invoice) => router.push(withEditMode(FINANCE_ROUTES.invoiceDetail(invoice.id))),
    remove: (invoice: Invoice) => remove.mutateAsync(invoice.id),
    bulkDelete: (rows: Invoice[]) => bulkDelete.mutateAsync(rows.map((row) => row.id)),
  };
}
