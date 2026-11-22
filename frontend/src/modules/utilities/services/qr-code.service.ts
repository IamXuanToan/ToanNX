import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { UTILITIES_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  QrBank,
  QrCode,
  QrCodeDetail,
  QrCodeFilters,
  QrCodeInput,
  QrPreview,
  QrPreviewInput,
} from "../types/qr-code.types";

const crud = createCrudService<
  QrCode,
  QrCodeFilters,
  QrCodeInput,
  Partial<QrCodeInput>,
  QrCodeDetail
>(UTILITIES_API_ENDPOINTS.qrCodes);

/** Service mã QR (BE `utilities/services/qr_code_service.py`). */
export const qrCodeService = {
  ...crud,

  /** @param input - Loại, nội dung, kiểu dáng. @param signal - Tín hiệu hủy. @returns Payload và SVG (data URL). */
  async preview(input: QrPreviewInput, signal?: AbortSignal): Promise<QrPreview> {
    return (
      await apiClient.post<QrPreview>(UTILITIES_API_ENDPOINTS.qrCodePreview, input, { signal })
    ).data;
  },

  /** @param signal - Tín hiệu hủy. @returns Danh mục ngân hàng VietQR (tĩnh). */
  async banks(signal?: AbortSignal): Promise<QrBank[]> {
    return (await apiClient.get<QrBank[]>(UTILITIES_API_ENDPOINTS.qrCodeBanks, { signal })).data;
  },
};
