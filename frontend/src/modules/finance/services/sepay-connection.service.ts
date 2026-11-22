import { apiClient } from "@/shares/lib/api/api-client";

import { FINANCE_API_ENDPOINTS } from "../constants/api-endpoints";
import type { SepayImportResult, SepayPreviewRow, SepayStatus } from "../types/sepay.types";

/** Service kết nối SePay của chính mình (BE `finance/services/sepay_connection_service.py`, import). */
export const sepayConnectionService = {
  async status(signal?: AbortSignal): Promise<SepayStatus> {
    return (await apiClient.get<SepayStatus>(FINANCE_API_ENDPOINTS.sepayConnection, { signal }))
      .data;
  },

  /** @param input - Token (chỉ ghi) và/hoặc bật tắt. @returns Trạng thái mới. */
  async save(input: { token?: string; isActive?: boolean }): Promise<SepayStatus> {
    return (await apiClient.put<SepayStatus>(FINANCE_API_ENDPOINTS.sepayConnection, input)).data;
  },

  async remove(): Promise<void> {
    await apiClient.delete(FINANCE_API_ENDPOINTS.sepayConnection);
  },

  /** @returns Số tài khoản ngân hàng liên kết. */
  async test(): Promise<number> {
    return (
      await apiClient.post<{ bankAccountCount: number }>(FINANCE_API_ENDPOINTS.sepayConnectionTest)
    ).data.bankAccountCount;
  },

  async rotateSecret(): Promise<SepayStatus> {
    return (await apiClient.post<SepayStatus>(FINANCE_API_ENDPOINTS.sepaySecretRotate)).data;
  },

  async preview(dateFrom: string, dateTo: string): Promise<SepayPreviewRow[]> {
    return (
      await apiClient.post<SepayPreviewRow[]>(FINANCE_API_ENDPOINTS.sepayPreview, {
        dateFrom,
        dateTo,
      })
    ).data;
  },

  async import(dateFrom: string, dateTo: string, ids: string[]): Promise<SepayImportResult> {
    return (
      await apiClient.post<SepayImportResult>(FINANCE_API_ENDPOINTS.sepayImport, {
        dateFrom,
        dateTo,
        ids,
      })
    ).data;
  },
};
