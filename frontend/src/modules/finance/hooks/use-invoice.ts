"use client";

import { useQuery } from "@tanstack/react-query";

import { financeKeys } from "../constants/query-keys";
import { invoiceService } from "../services/invoice.service";

/** @param id - Id bản ghi. @returns Chi tiết hóa đơn. */
export function useInvoice(id: string) {
  return useQuery({
    queryKey: financeKeys.invoices.detail(id),
    queryFn: ({ signal }) => invoiceService.get(id, signal),
  });
}
