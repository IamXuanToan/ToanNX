"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { assetService } from "../services/asset.service";

/** @returns Mutation xóa mềm một Thiết bị cá nhân. */
export function useDeleteAsset() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => assetService.delete(id),
    invalidate: [workspaceKeys.all],
    success: "deleted",
  });
}
