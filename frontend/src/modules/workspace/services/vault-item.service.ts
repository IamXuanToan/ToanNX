import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  VaultItem,
  VaultItemCreateInput,
  VaultItemFilters,
  VaultItemReveal,
  VaultItemUpdateInput,
} from "../types/vault-item.types";

/** Service Két sắt bí mật (BE `vault_item_service.py`), giải mã tách riêng qua `reveal`. */
export const vaultItemService = {
  ...createCrudService<
    VaultItem,
    VaultItemFilters,
    VaultItemCreateInput,
    VaultItemUpdateInput,
    VaultItem
  >(WORKSPACE_API_ENDPOINTS.vaultItems),

  /** Giải mã `secret` (cần quyền `workspace.vault_item.reveal`, ghi audit journal). */
  async reveal(id: string): Promise<VaultItemReveal> {
    return (await apiClient.post<VaultItemReveal>(WORKSPACE_API_ENDPOINTS.vaultItemReveal(id)))
      .data;
  },
};
