import { apiClient } from "@/shares/lib/api/api-client";

import { FINANCE_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  PlatformTaxRate,
  PlatformTaxRateInput,
  PlatformTaxRateMutation,
} from "../types/platform-tax-rate.types";

/** Service lịch sử khấu trừ của nền tảng (BE `finance/services/platform_tax_rate_service.py`). */
export const platformTaxRateService = {
  /** @param platformId - Nền tảng. @param signal - Hủy. @returns Lịch sử mới nhất trước. */
  async list(platformId: string, signal?: AbortSignal): Promise<PlatformTaxRate[]> {
    return (
      await apiClient.get<PlatformTaxRate[]>(FINANCE_API_ENDPOINTS.platformTaxRates(platformId), {
        signal,
      })
    ).data;
  },

  /** @param platformId - Nền tảng. @param date - Ngày (YYYY-MM-DD). @returns Mốc áp dụng hoặc null. */
  async resolve(
    platformId: string,
    date: string,
    signal?: AbortSignal,
  ): Promise<PlatformTaxRate | null> {
    return (
      await apiClient.get<PlatformTaxRate | null>(
        FINANCE_API_ENDPOINTS.platformTaxRateResolve(platformId),
        {
          query: { date },
          signal,
        },
      )
    ).data;
  },

  /** @returns Mốc mới + giao dịch bị ảnh hưởng. */
  async create(platformId: string, input: PlatformTaxRateInput): Promise<PlatformTaxRateMutation> {
    return (
      await apiClient.post<PlatformTaxRateMutation>(
        FINANCE_API_ENDPOINTS.platformTaxRates(platformId),
        input,
      )
    ).data;
  },

  /** @returns Mốc sau khi sửa + giao dịch bị ảnh hưởng. */
  async update(
    platformId: string,
    rateId: string,
    input: PlatformTaxRateInput,
  ): Promise<PlatformTaxRateMutation> {
    return (
      await apiClient.patch<PlatformTaxRateMutation>(
        FINANCE_API_ENDPOINTS.platformTaxRate(platformId, rateId),
        input,
      )
    ).data;
  },

  /** @returns Giao dịch bị ảnh hưởng sau khi xóa mốc. */
  async remove(platformId: string, rateId: string): Promise<PlatformTaxRateMutation> {
    return (
      await apiClient.delete<PlatformTaxRateMutation>(
        FINANCE_API_ENDPOINTS.platformTaxRate(platformId, rateId),
      )
    ).data;
  },
};
