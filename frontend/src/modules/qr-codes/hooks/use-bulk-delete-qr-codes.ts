"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { qrCodeKeys } from "../constants/query-keys";
import { qrCodeService } from "../services/qr-code.service";

const INVALIDATE = [qrCodeKeys.all];

/**
 * Mutation xóa mềm nhiều mã QR hàng loạt.
 *
 * @returns Mutation xóa nhiều mã QR.
 */
export function useBulkDeleteQrCodes() {
  return useResourceMutation({
    mutationFn: (ids: string[]) => qrCodeService.bulkDelete(ids),
    invalidate: INVALIDATE,
    success: "bulkDeleted",
  });
}
