"use client";

import { useQuery } from "@tanstack/react-query";

import { currencyKeys } from "../constants/query-keys";
import { currencyService } from "../services/currency.service";

/** @returns Mọi tiền tệ (ô chọn), tiền tệ gốc trước. */
export function useCurrencyOptions() {
  return useQuery({
    queryKey: currencyKeys.currencies.options(),
    queryFn: ({ signal }) => currencyService.listAll({ ordering: "position" }, signal),
    staleTime: 300_000,
  });
}
