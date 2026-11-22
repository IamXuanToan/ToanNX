"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { currencyKeys } from "../constants/query-keys";
import { exchangeRateService } from "../services/exchange-rate.service";

/** @returns Mutation xóa tỷ giá tay. */
export function useDeleteExchangeRate() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => exchangeRateService.delete(id),
    invalidate: [currencyKeys.rates.all],
    success: "deleted",
  });
}
