"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { assetWarrantyClaimService } from "../services/asset-warranty-claim.service";

/** @returns Chi tiết một Phiếu bảo hành / sửa chữa. */
export function useWarrantyClaim(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.warrantyClaims.detail(id ?? ""),
    queryFn: ({ signal }) => assetWarrantyClaimService.get(id ?? "", signal),
    enabled: Boolean(id) && enabled,
  });
}
