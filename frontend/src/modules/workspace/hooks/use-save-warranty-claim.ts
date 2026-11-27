"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { assetWarrantyClaimService } from "../services/asset-warranty-claim.service";
import type {
  AssetWarrantyClaim,
  AssetWarrantyClaimInput,
} from "../types/asset-warranty-claim.types";

/** @param id - Có ID thì sửa phiếu bảo hành, không thì tạo mới. */
export function useSaveWarrantyClaim(id?: string) {
  return useResourceMutation<AssetWarrantyClaimInput, AssetWarrantyClaim>({
    mutationFn: (input) =>
      id ? assetWarrantyClaimService.update(id, input) : assetWarrantyClaimService.create(input),
    invalidate: [workspaceKeys.all],
    toastError: false,
  });
}
