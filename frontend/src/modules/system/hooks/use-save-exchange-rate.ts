"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { currencyKeys } from "../constants/query-keys";
import { exchangeRateService } from "../services/exchange-rate.service";
import type { ExchangeRate, ExchangeRateInput } from "../types/currency.types";

/** @returns Mutation lưu tỷ giá tay. */
export function useSaveExchangeRate() {
  return useResourceMutation<{ id?: string; input: ExchangeRateInput }, ExchangeRate>({
    mutationFn: ({ id, input }) =>
      id ? exchangeRateService.update(id, input) : exchangeRateService.create(input),
    invalidate: [currencyKeys.rates.all],
    success: "saved",
  });
}
