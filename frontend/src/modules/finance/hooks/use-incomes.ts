"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { financeKeys } from "../constants/query-keys";
import { incomeService } from "../services/income.service";
import type { IncomeFilters } from "../types/income.types";

/** @param filters - Bộ lọc + phân trang. @returns Danh sách giao dịch thu nhập. */
export function useIncomes(filters: IncomeFilters) {
  return useListQuery(financeKeys.incomes.list(filters), (signal) =>
    incomeService.list(filters, signal),
  );
}
