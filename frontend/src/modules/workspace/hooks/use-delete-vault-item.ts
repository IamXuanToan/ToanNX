"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { vaultItemService } from "../services/vault-item.service";

/** @returns Mutation xóa mềm một mục Két sắt. */
export function useDeleteVaultItem() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => vaultItemService.delete(id),
    invalidate: [workspaceKeys.all],
    success: "deleted",
  });
}
