"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { vaultItemService } from "../services/vault-item.service";

/** @returns Chi tiết metadata một mục Két sắt. */
export function useVaultItem(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.vaultItems.detail(id ?? ""),
    queryFn: ({ signal }) => vaultItemService.get(id ?? "", signal),
    enabled: Boolean(id) && enabled,
  });
}
