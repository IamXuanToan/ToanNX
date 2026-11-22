"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { qrCodeKeys } from "../constants/query-keys";
import { qrCodeService } from "../services/qr-code.service";
import type { QrCodeInput } from "../types/qr-code.types";

const INVALIDATE = [qrCodeKeys.all];

/**
 * Mutation sửa thông tin và kiểu dáng mã QR.
 *
 * @param id - Id mã QR.
 * @returns Mutation cập nhật mã QR.
 */
export function useUpdateQrCode(id: string) {
  return useResourceMutation({
    mutationFn: (input: Partial<QrCodeInput>) => qrCodeService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
