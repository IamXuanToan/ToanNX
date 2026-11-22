"use client";

import { useQuery } from "@tanstack/react-query";

import { currencyKeys } from "../constants/query-keys";
import { exchangeRateService } from "../services/exchange-rate.service";

/** @param currencyId - Ngoại tệ (trống = không tra). @param date - Ngày. @returns Tỷ giá tự động cho ngày. */
export function useExchangeRateResolve(currencyId: string | undefined, date: string) {
  return useQuery({
    queryKey: currencyKeys.resolve(currencyId ?? "", date),
    queryFn: ({ signal }) => exchangeRateService.resolve(currencyId ?? "", date, signal),
    enabled: Boolean(currencyId && date),
    retry: false,
  });
}
