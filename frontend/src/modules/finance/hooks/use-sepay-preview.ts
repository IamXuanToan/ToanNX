"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { sepayConnectionService } from "../services/sepay-connection.service";
import type { SepayPreviewRow } from "../types/sepay.types";

/** @returns Mutation xem trước giao dịch SePay. */
export function useSepayPreview() {
  return useResourceMutation<{ dateFrom: string; dateTo: string }, SepayPreviewRow[]>({
    mutationFn: ({ dateFrom, dateTo }) => sepayConnectionService.preview(dateFrom, dateTo),
    invalidate: [financeKeys.all],
    success: false,
  });
}
