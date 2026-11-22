"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { currencyKeys } from "../constants/query-keys";
import { currencyService } from "../services/currency.service";
import type { Currency, CurrencyInput } from "../types/currency.types";

/** @returns Mutation lưu tiền tệ. */
export function useSaveCurrency() {
  return useResourceMutation<{ id?: string; input: CurrencyInput }, Currency>({
    mutationFn: ({ id, input }) =>
      id ? currencyService.update(id, input) : currencyService.create(input),
    invalidate: [currencyKeys.currencies.all],
    success: "saved",
  });
}
