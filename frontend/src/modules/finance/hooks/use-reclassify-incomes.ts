"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { incomeService } from "../services/income.service";

/** @returns Mutation nhận diện lại. */
export function useReclassifyIncomes() {
  return useResourceMutation<string[], number>({
    mutationFn: (ids) => incomeService.reclassify(ids),
    invalidate: [financeKeys.all],
    success: "bulkUpdated",
  });
}
