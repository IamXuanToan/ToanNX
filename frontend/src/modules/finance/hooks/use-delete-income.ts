"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { incomeService } from "../services/income.service";

/** @returns Mutation xóa giao dịch. */
export function useDeleteIncome() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => incomeService.delete(id),
    invalidate: [financeKeys.all],
    success: "deleted",
  });
}
