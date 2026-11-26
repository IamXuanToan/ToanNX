"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { assetService } from "../services/asset.service";

/** @returns Chi tiết một Thiết bị cá nhân. */
export function useAsset(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.assets.detail(id ?? ""),
    queryFn: ({ signal }) => assetService.get(id ?? "", signal),
    enabled: Boolean(id) && enabled,
  });
}
