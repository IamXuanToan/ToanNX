"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { qrCodeKeys } from "../constants/query-keys";
import { qrCodeService } from "../services/qr-code.service";
import type { QrCodeInput } from "../types/qr-code.types";

const INVALIDATE = [qrCodeKeys.all];

/**
 * Mutation tạo mã QR mới.
 *
 * @returns Mutation tạo mã QR.
 */
export function useCreateQrCode() {
  return useResourceMutation({
    mutationFn: (input: QrCodeInput) => qrCodeService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
