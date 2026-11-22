"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { qrCodeKeys } from "../constants/query-keys";
import { qrCodeService } from "../services/qr-code.service";
import type { QrCodeFilters } from "../types/qr-code.types";

/**
 * Lấy danh sách mã QR theo bộ lọc và phân trang.
 *
 * @param filters - Bộ lọc và phân trang.
 * @param enabled - Bật/tắt truy vấn.
 * @returns Truy vấn danh sách mã QR.
 */
export function useQrCodes(filters: QrCodeFilters, enabled = true) {
  return useListQuery(qrCodeKeys.list(filters), (signal) => qrCodeService.list(filters, signal), {
    enabled,
  });
}
