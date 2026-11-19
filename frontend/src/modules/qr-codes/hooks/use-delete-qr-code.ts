"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { qrCodeKeys } from "../constants/query-keys";
import { qrCodeService } from "../services/qr-code.service";

const INVALIDATE = [qrCodeKeys.all];

/**
 * Mutation xóa mềm một mã QR.
 *
 * @returns Mutation xóa mã QR.
 */
export function useDeleteQrCode() {
  return useResourceMutation({
    mutationFn: (id: string) => qrCodeService.delete(id),
    invalidate: INVALIDATE,
    success: "deleted",
  });
}
