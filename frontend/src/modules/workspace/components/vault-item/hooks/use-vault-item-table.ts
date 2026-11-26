"use client";

import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { workspaceKeys } from "../../../constants/query-keys";
import { WORKSPACE_ROUTES } from "../../../constants/routes";
import { useDeleteVaultItem } from "../../../hooks/use-delete-vault-item";
import { useVaultItems } from "../../../hooks/use-vault-items";
import { useWorkspaceOwnerOptions } from "../../../hooks/use-workspace-owner-options";
import { VAULT_ITEM_PERMISSIONS } from "../../../permissions/vault-item-permission";
import { vaultItemService } from "../../../services/vault-item.service";
import type { VaultItem } from "../../../types/vault-item.types";
import { useVaultRevealDialog } from "./use-vault-reveal-dialog";

const FILTER_KEYS = ["category", "owner"] as const;

/** @returns State bảng Két sắt bí mật + modal giải mã. */
export function useVaultItemTable() {
  const router = useRouter();
  const ownerFilter = useWorkspaceOwnerOptions(VAULT_ITEM_PERMISSIONS.manageAll);
  const table = useTableState({ ordering: "-updated_at", filterKeys: FILTER_KEYS });
  const query = useVaultItems({
    ...table.filters,
    category: table.getFilterValues("category"),
    owner: ownerFilter.canFilterOwner ? table.extraFilters.owner : undefined,
  });
  const remove = useDeleteVaultItem();
  const bulk = useBulkActions<VaultItem>({
    service: vaultItemService,
    invalidate: [workspaceKeys.all],
  });
  const revealDialog = useVaultRevealDialog();
  const [revealItem, setRevealItem] = useState<VaultItem | null>(null);

  return {
    table,
    query,
    ...ownerFilter,
    revealItem,
    revealDialog,
    startReveal: async (item: VaultItem) => {
      setRevealItem(item);
      await revealDialog.openReveal(item.id);
    },
    closeReveal: (open: boolean) => {
      if (!open) {
        setRevealItem(null);
        revealDialog.reset();
      }
    },
    view: (item: VaultItem) => router.push(WORKSPACE_ROUTES.vaultDetail(item.id)),
    edit: (item: VaultItem) => router.push(withEditMode(WORKSPACE_ROUTES.vaultDetail(item.id))),
    remove: (item: VaultItem) => remove.mutateAsync(item.id),
    bulkDelete: bulk.bulkDelete,
  };
}
