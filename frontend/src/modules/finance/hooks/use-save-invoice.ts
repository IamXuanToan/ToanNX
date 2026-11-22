"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { invoiceService } from "../services/invoice.service";
import type { Invoice, InvoiceInput } from "../types/invoice.types";

/** @param id - Có id thì sửa, không thì tạo. @returns Mutation lưu hóa đơn (form tự báo lỗi theo field). */
export function useSaveInvoice(id?: string) {
  return useResourceMutation<InvoiceInput, Invoice>({
    mutationFn: (input) => (id ? invoiceService.update(id, input) : invoiceService.create(input)),
    invalidate: [financeKeys.all],
    toastError: false,
  });
}
