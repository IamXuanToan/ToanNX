"use client";

import { useQuery } from "@tanstack/react-query";

import { financeKeys } from "../constants/query-keys";
import { platformTaxRateService } from "../services/platform-tax-rate.service";

/** @param platformId - Nền tảng. @returns Lịch sử khấu trừ mới nhất trước. */
export function usePlatformTaxRates(platformId: string) {
  return useQuery({
    queryKey: financeKeys.taxRates(platformId),
    queryFn: ({ signal }) => platformTaxRateService.list(platformId, signal),
  });
}
