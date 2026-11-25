"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { financeKeys } from "../constants/query-keys";
import { invoiceService } from "../services/invoice.service";
import type { InvoiceFilters } from "../types/invoice.types";

/** @param filters - Bộ lọc + phân trang. @param options - Tùy chọn bật/tắt truy vấn. @returns Danh sách hóa đơn / chứng từ. */
export function useInvoices(filters: InvoiceFilters, options: { enabled?: boolean } = {}) {
  return useListQuery(
    financeKeys.invoices.list(filters),
    (signal) => invoiceService.list(filters, signal),
    options,
  );
}
