"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { workspaceKeys } from "../constants/query-keys";
import { assetWarrantyClaimService } from "../services/asset-warranty-claim.service";
import type { AssetWarrantyClaimFilters } from "../types/asset-warranty-claim.types";

/** @returns Danh sách Phiếu bảo hành / sửa chữa thiết bị. */
export function useWarrantyClaims(
  filters: AssetWarrantyClaimFilters,
  options: { enabled?: boolean } = {},
) {
  return useListQuery(
    workspaceKeys.warrantyClaims.list(filters),
    (signal) => assetWarrantyClaimService.list(filters, signal),
    options,
  );
}
