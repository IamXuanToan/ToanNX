"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { incomeService } from "../services/income.service";

/** @returns Mutation tính lại khấu trừ theo lịch sử hiện tại. */
export function useRecalculateIncomeTax() {
  return useResourceMutation<{ ids: string[]; resetManual?: boolean }, number>({
    mutationFn: ({ ids, resetManual }) => incomeService.recalculateTax(ids, resetManual),
    invalidate: [financeKeys.all],
    success: "bulkUpdated",
  });
}
