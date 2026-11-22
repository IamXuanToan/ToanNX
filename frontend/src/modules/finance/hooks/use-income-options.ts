"use client";

import { useQuery } from "@tanstack/react-query";

import { financeKeys } from "../constants/query-keys";
import { incomeService } from "../services/income.service";
import type { IncomeFilters } from "../types/income.types";

/** @param filters - Năm/nền tảng để thu hẹp. @returns Giao dịch để gắn vào hóa đơn. */
export function useIncomeOptions(filters: IncomeFilters, enabled = true) {
  return useQuery({
    queryKey: financeKeys.incomes.options(filters),
    queryFn: ({ signal }) =>
      incomeService.listAll({ ...filters, ordering: "-received_at" }, signal),
    enabled,
  });
}
