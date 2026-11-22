"use client";

import { useQuery } from "@tanstack/react-query";

import { financeKeys } from "../constants/query-keys";
import { incomeService } from "../services/income.service";

/** @param id - Id bản ghi. @returns Chi tiết giao dịch. */
export function useIncome(id: string) {
  return useQuery({
    queryKey: financeKeys.incomes.detail(id),
    queryFn: ({ signal }) => incomeService.get(id, signal),
  });
}
