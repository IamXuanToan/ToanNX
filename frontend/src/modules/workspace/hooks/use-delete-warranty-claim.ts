"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { assetWarrantyClaimService } from "../services/asset-warranty-claim.service";

/** @returns Mutation xóa mềm một Phiếu bảo hành / sửa chữa. */
export function useDeleteWarrantyClaim() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => assetWarrantyClaimService.delete(id),
    invalidate: [workspaceKeys.all],
    success: "deleted",
  });
}
