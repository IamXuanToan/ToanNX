"use client";

import { useQuery } from "@tanstack/react-query";

import { qrCodeKeys } from "../constants/query-keys";
import { qrCodeService } from "../services/qr-code.service";

/**
 * Lấy danh mục ngân hàng hỗ trợ VietQR (dữ liệu tĩnh trong phiên).
 *
 * @returns Truy vấn React Query danh mục ngân hàng.
 */
export function useQrBanks() {
  return useQuery({
    queryKey: qrCodeKeys.banks(),
    queryFn: ({ signal }) => qrCodeService.banks(signal),
    staleTime: Infinity,
  });
}
