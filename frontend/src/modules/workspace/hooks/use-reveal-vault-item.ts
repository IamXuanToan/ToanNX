"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { vaultItemService } from "../services/vault-item.service";
import type { VaultItemReveal } from "../types/vault-item.types";

/** @returns Mutation giải mã `secret` Két sắt (kiểm quyền `workspace.vault_item.reveal`). */
export function useRevealVaultItem() {
  return useResourceMutation<string, VaultItemReveal>({
    mutationFn: (id) => vaultItemService.reveal(id),
    invalidate: [workspaceKeys.vaultItems.all],
    success: false,
  });
}
