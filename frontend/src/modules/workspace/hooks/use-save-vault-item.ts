"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { vaultItemService } from "../services/vault-item.service";
import type {
  VaultItem,
  VaultItemCreateInput,
  VaultItemUpdateInput,
} from "../types/vault-item.types";

/** @param id - Có ID thì sửa (secret rỗng = giữ nguyên), không thì tạo mục Két sắt. */
export function useSaveVaultItem(id?: string) {
  return useResourceMutation<VaultItemCreateInput | VaultItemUpdateInput, VaultItem>({
    mutationFn: (input) =>
      id
        ? vaultItemService.update(id, input as VaultItemUpdateInput)
        : vaultItemService.create(input as VaultItemCreateInput),
    invalidate: [workspaceKeys.all],
    toastError: false,
  });
}
