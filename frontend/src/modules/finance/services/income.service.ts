import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { FINANCE_API_ENDPOINTS } from "../constants/api-endpoints";
import type { Income, IncomeFilters, IncomeInput } from "../types/income.types";

const crud = createCrudService<Income, IncomeFilters, IncomeInput, IncomeInput, Income>(
  FINANCE_API_ENDPOINTS.incomes,
);

/** Service giao dịch thu nhập (BE `finance/services/income_service.py`). */
export const incomeService = {
  ...crud,

  /** @param ids - Giao dịch (trống = mọi giao dịch chưa nhận diện). @returns Số giao dịch đổi nền tảng. */
  async reclassify(ids: string[]): Promise<number> {
    return (
      await apiClient.post<{ changed: number }>(FINANCE_API_ENDPOINTS.incomeReclassify, { ids })
    ).data.changed;
  },

  /** @param ids - Giao dịch. @param resetManual - Bỏ thuế nhập tay. @returns Số giao dịch đã tính lại. */
  async recalculateTax(ids: string[], resetManual = false): Promise<number> {
    return (
      await apiClient.post<{ changed: number }>(FINANCE_API_ENDPOINTS.incomeRecalculateTax, {
        ids,
        resetManual,
      })
    ).data.changed;
  },

  /** @param id - Giao dịch dùng tỷ giá tự động. @returns Giao dịch sau khi lấy lại tỷ giá. */
  async refreshRate(id: string): Promise<Income> {
    return (await apiClient.post<Income>(FINANCE_API_ENDPOINTS.incomeRefreshRate(id))).data;
  },
};
