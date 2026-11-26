"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { workspaceKeys } from "../constants/query-keys";
import { assetService } from "../services/asset.service";
import type { AssetFilters } from "../types/asset.types";

/** @returns Danh sách Thiết bị cá nhân (có phân trang). */
export function useAssets(filters: AssetFilters, options: { enabled?: boolean } = {}) {
  return useListQuery(
    workspaceKeys.assets.list(filters),
    (signal) => assetService.list(filters, signal),
    options,
  );
}
