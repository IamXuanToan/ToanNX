"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { VaultItemDetail } from "../../components/vault-item/vault-item-detail";
import { VAULT_ITEM_PERMISSIONS } from "../../permissions/vault-item-permission";

/** @param props - ID mục két sắt và slot lịch sử. @returns Trang chi tiết Két sắt. */
export function VaultItemDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(VAULT_ITEM_PERMISSIONS.read);
  const canUpdate = usePermission(VAULT_ITEM_PERMISSIONS.update);
  const canReveal = usePermission(VAULT_ITEM_PERMISSIONS.reveal);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) return <ForbiddenView />;

  return (
    <EditModeProvider canEdit={canUpdate}>
      <VaultItemDetail id={id} canUpdate={isEditing} canReveal={canReveal} history={history} />
    </EditModeProvider>
  );
}
