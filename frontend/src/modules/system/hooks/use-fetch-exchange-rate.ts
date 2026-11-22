"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { currencyKeys } from "../constants/query-keys";
import { exchangeRateService } from "../services/exchange-rate.service";
import type { ExchangeRate } from "../types/currency.types";

/** @returns Mutation lấy lại tỷ giá từ Vietcombank. */
export function useFetchExchangeRate() {
  return useResourceMutation<{ currencyId: string; date: string }, ExchangeRate>({
    mutationFn: ({ currencyId, date }) => exchangeRateService.fetch(currencyId, date),
    invalidate: [currencyKeys.rates.all],
    success: "saved",
  });
}
