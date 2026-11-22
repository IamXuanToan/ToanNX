"use client";

import { useQuery } from "@tanstack/react-query";

import { financeKeys } from "../constants/query-keys";
import { platformTaxRateService } from "../services/platform-tax-rate.service";

/** @param platformId - Nền tảng (trống = không tra). @param date - Ngày nhận. @returns Mốc áp dụng. */
export function usePlatformTaxRateResolve(platformId: string | null | undefined, date: string) {
  return useQuery({
    queryKey: financeKeys.taxRateResolve(platformId ?? "", date),
    queryFn: ({ signal }) => platformTaxRateService.resolve(platformId ?? "", date, signal),
    enabled: Boolean(platformId && date),
  });
}
