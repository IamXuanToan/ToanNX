import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { QR_CODES_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  QrBank,
  QrCode,
  QrCodeDetail,
  QrCodeFilters,
  QrCodeInput,
  QrPreview,
  QrPreviewInput,
} from "../types/qr-codes.types";

const crud = createCrudService<
  QrCode,
  QrCodeFilters,
  QrCodeInput,
  Partial<QrCodeInput>,
  QrCodeDetail
>(QR_CODES_API_ENDPOINTS.codes);

/** Service mã QR (BE `qr_codes/services/qr_code_service.py`). */
export const qrCodeService = {
  ...crud,

  /** @param input - Loại, nội dung, kiểu dáng. @param signal - Tín hiệu hủy. @returns Payload và SVG (data URL). */
  async preview(input: QrPreviewInput, signal?: AbortSignal): Promise<QrPreview> {
    return (await apiClient.post<QrPreview>(QR_CODES_API_ENDPOINTS.preview, input, { signal }))
      .data;
  },

  /** @param signal - Tín hiệu hủy. @returns Danh mục ngân hàng VietQR (tĩnh). */
  async banks(signal?: AbortSignal): Promise<QrBank[]> {
    return (await apiClient.get<QrBank[]>(QR_CODES_API_ENDPOINTS.banks, { signal })).data;
  },
};
