"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { workspaceKeys } from "../constants/query-keys";
import { vaultItemService } from "../services/vault-item.service";
import type { VaultItemFilters } from "../types/vault-item.types";

/** @returns Danh sách mục Két sắt bí mật (chỉ metadata + 4 ký tự cuối). */
export function useVaultItems(filters: VaultItemFilters, options: { enabled?: boolean } = {}) {
  return useListQuery(
    workspaceKeys.vaultItems.list(filters),
    (signal) => vaultItemService.list(filters, signal),
    options,
  );
}
