import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  ExchangeRate,
  ExchangeRateFilters,
  ExchangeRateInput,
  ResolvedRate,
} from "../types/currency.types";

const crud = createCrudService<
  ExchangeRate,
  ExchangeRateFilters,
  ExchangeRateInput,
  ExchangeRateInput,
  ExchangeRate
>(SYSTEM_API_ENDPOINTS.exchangeRates);

/** Service tỷ giá (BE `system/services/exchange_rate_service.py`). */
export const exchangeRateService = {
  ...crud,

  /** @param currencyId - Ngoại tệ. @param date - Ngày (YYYY-MM-DD). @returns Tỷ giá Vietcombank dùng cho ngày. */
  async resolve(currencyId: string, date: string, signal?: AbortSignal): Promise<ResolvedRate> {
    return (
      await apiClient.get<ResolvedRate>(SYSTEM_API_ENDPOINTS.exchangeRateResolve, {
        query: { currencyId, date },
        signal,
      })
    ).data;
  },

  /** @returns Dòng tỷ giá vừa lấy lại từ API. */
  async fetch(currencyId: string, date: string): Promise<ExchangeRate> {
    return (
      await apiClient.post<ExchangeRate>(SYSTEM_API_ENDPOINTS.exchangeRateFetch, {
        currencyId,
        date,
      })
    ).data;
  },
};
