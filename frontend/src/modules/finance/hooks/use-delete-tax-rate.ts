"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { platformTaxRateService } from "../services/platform-tax-rate.service";
import type { PlatformTaxRateMutation } from "../types/platform-tax-rate.types";

/** @returns Mutation xóa mốc khấu trừ. */
export function useDeleteTaxRate() {
  return useResourceMutation<{ platformId: string; rateId: string }, PlatformTaxRateMutation>({
    mutationFn: ({ platformId, rateId }) => platformTaxRateService.remove(platformId, rateId),
    invalidate: [financeKeys.all],
    success: "deleted",
  });
}
