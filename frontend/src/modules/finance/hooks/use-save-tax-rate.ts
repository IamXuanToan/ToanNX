"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { platformTaxRateService } from "../services/platform-tax-rate.service";
import type {
  PlatformTaxRateInput,
  PlatformTaxRateMutation,
} from "../types/platform-tax-rate.types";

/** @returns Mutation thêm/sửa mốc khấu trừ (kết quả có giao dịch bị ảnh hưởng). */
export function useSaveTaxRate() {
  return useResourceMutation<
    { platformId: string; rateId?: string; input: PlatformTaxRateInput },
    PlatformTaxRateMutation
  >({
    mutationFn: ({ platformId, rateId, input }) =>
      rateId
        ? platformTaxRateService.update(platformId, rateId, input)
        : platformTaxRateService.create(platformId, input),
    invalidate: [financeKeys.all],
    success: "saved",
  });
}
