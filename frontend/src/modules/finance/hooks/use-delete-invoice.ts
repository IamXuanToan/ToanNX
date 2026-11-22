"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { invoiceService } from "../services/invoice.service";

/** @returns Mutation xóa hóa đơn. */
export function useDeleteInvoice() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => invoiceService.delete(id),
    invalidate: [financeKeys.all],
    success: "deleted",
  });
}
