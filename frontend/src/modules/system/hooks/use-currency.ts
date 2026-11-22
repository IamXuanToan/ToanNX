"use client";

import { useQuery } from "@tanstack/react-query";

import { currencyKeys } from "../constants/query-keys";
import { currencyService } from "../services/currency.service";

/** @param id - Tiền tệ. @returns Chi tiết. */
export function useCurrency(id: string) {
  return useQuery({
    queryKey: currencyKeys.currencies.detail(id),
    queryFn: ({ signal }) => currencyService.get(id, signal),
  });
}
