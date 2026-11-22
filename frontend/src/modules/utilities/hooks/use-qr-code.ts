"use client";

import { useQuery } from "@tanstack/react-query";

import { qrCodeKeys } from "../constants/query-keys";
import { qrCodeService } from "../services/qr-code.service";

/**
 * Lấy chi tiết một mã QR theo id.
 *
 * @param id - Id mã QR.
 * @returns Truy vấn React Query chi tiết mã QR.
 */
export function useQrCode(id: string) {
  return useQuery({
    queryKey: qrCodeKeys.detail(id),
    queryFn: ({ signal }) => qrCodeService.get(id, signal),
  });
}
