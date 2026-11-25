"use client";

import { useQuery } from "@tanstack/react-query";

import { usePermission } from "@/modules/system/hooks/use-permission";

import { financeKeys } from "../constants/query-keys";
import { PLATFORM_PERMISSIONS } from "../permissions/platform-permission";
import { platformTaxRateService } from "../services/platform-tax-rate.service";

/** @param platformId - Nền tảng (trống = không tra). @param date - Ngày nhận. @returns Mốc áp dụng. */
export function usePlatformTaxRateResolve(platformId: string | null | undefined, date: string) {
  const canRead = usePermission(PLATFORM_PERMISSIONS.read);
  return useQuery({
    queryKey: financeKeys.taxRateResolve(platformId ?? "", date),
    queryFn: ({ signal }) => platformTaxRateService.resolve(platformId ?? "", date, signal),
    enabled: Boolean(platformId && date) && canRead,
  });
}
