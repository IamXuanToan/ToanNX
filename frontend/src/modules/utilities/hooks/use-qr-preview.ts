"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { qrCodeKeys } from "../constants/query-keys";
import { qrCodeService } from "../services/qr-code.service";
import type { QrPreviewInput } from "../types/qr-code.types";

/**
 * Xem trước mã QR (giữ ảnh cũ trong khi đang kết xuất ảnh mới).
 *
 * @param input - Dữ liệu đã ổn định của mã QR (đã debounce).
 * @returns Truy vấn React Query dữ liệu xem trước mã QR.
 */
export function useQrPreview(input: QrPreviewInput | null) {
  return useQuery({
    queryKey: qrCodeKeys.preview(input ?? {}),
    queryFn: ({ signal }) => qrCodeService.preview(input!, signal),
    enabled: input !== null,
    placeholderData: keepPreviousData,
    retry: false,
  });
}
