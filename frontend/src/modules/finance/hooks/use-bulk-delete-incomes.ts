"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { incomeService } from "../services/income.service";

/** @returns Mutation xóa nhiều giao dịch. */
export function useBulkDeleteIncomes() {
  return useResourceMutation<string[], number>({
    mutationFn: (ids) => incomeService.bulkDelete(ids),
    invalidate: [financeKeys.all],
    success: "bulkDeleted",
  });
}
