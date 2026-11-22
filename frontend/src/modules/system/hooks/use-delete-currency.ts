"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { currencyKeys } from "../constants/query-keys";
import { currencyService } from "../services/currency.service";

/** @returns Mutation xóa tiền tệ. */
export function useDeleteCurrency() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => currencyService.delete(id),
    invalidate: [currencyKeys.currencies.all],
    success: "deleted",
  });
}
