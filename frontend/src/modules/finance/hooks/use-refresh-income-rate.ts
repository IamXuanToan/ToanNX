"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { incomeService } from "../services/income.service";
import type { Income } from "../types/income.types";

/** @returns Mutation lấy lại tỷ giá. */
export function useRefreshIncomeRate() {
  return useResourceMutation<string, Income>({
    mutationFn: (id) => incomeService.refreshRate(id),
    invalidate: [financeKeys.all],
    success: "saved",
  });
}
