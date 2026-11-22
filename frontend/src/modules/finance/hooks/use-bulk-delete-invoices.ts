"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { invoiceService } from "../services/invoice.service";

/** @returns Mutation xóa nhiều hóa đơn. */
export function useBulkDeleteInvoices() {
  return useResourceMutation<string[], number>({
    mutationFn: (ids) => invoiceService.bulkDelete(ids),
    invalidate: [financeKeys.all],
    success: "bulkDeleted",
  });
}
