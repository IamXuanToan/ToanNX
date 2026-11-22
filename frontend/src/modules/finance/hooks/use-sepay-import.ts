"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { sepayConnectionService } from "../services/sepay-connection.service";
import type { SepayImportResult } from "../types/sepay.types";

/** @returns Mutation nhập giao dịch đã chọn. */
export function useSepayImport() {
  return useResourceMutation<
    { dateFrom: string; dateTo: string; ids: string[] },
    SepayImportResult
  >({
    mutationFn: ({ dateFrom, dateTo, ids }) => sepayConnectionService.import(dateFrom, dateTo, ids),
    invalidate: [financeKeys.all],
    success: false,
  });
}
