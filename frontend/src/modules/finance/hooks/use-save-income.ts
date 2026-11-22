"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { incomeService } from "../services/income.service";
import type { Income, IncomeInput } from "../types/income.types";

/** @param id - Có id thì sửa, không thì tạo. @returns Mutation lưu giao dịch (form tự báo lỗi theo field). */
export function useSaveIncome(id?: string) {
  return useResourceMutation<IncomeInput, Income>({
    mutationFn: (input) => (id ? incomeService.update(id, input) : incomeService.create(input)),
    invalidate: [financeKeys.all],
    toastError: false,
  });
}
