"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { assetService } from "../services/asset.service";
import type { Asset, AssetInput } from "../types/asset.types";

/** @param id - Có ID thì cập nhật, không thì tạo mới Thiết bị. */
export function useSaveAsset(id?: string) {
  return useResourceMutation<AssetInput, Asset>({
    mutationFn: (input) => (id ? assetService.update(id, input) : assetService.create(input)),
    invalidate: [workspaceKeys.all],
    toastError: false,
  });
}
