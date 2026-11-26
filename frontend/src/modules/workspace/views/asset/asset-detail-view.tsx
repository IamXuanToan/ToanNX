"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { AssetDetail } from "../../components/asset/asset-detail";
import { ASSET_PERMISSIONS } from "../../permissions/asset-permission";
import { ASSET_WARRANTY_CLAIM_PERMISSIONS } from "../../permissions/asset-warranty-claim-permission";

/** @param props - ID thiết bị và slot lịch sử. @returns Trang chi tiết Thiết bị. */
export function AssetDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(ASSET_PERMISSIONS.read);
  const canUpdate = usePermission(ASSET_PERMISSIONS.update);
  const canCreateClaim = usePermission(ASSET_WARRANTY_CLAIM_PERMISSIONS.create);
  const canUpdateClaim = usePermission(ASSET_WARRANTY_CLAIM_PERMISSIONS.update);
  const canDeleteClaim = usePermission(ASSET_WARRANTY_CLAIM_PERMISSIONS.delete);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) return <ForbiddenView />;

  return (
    <EditModeProvider canEdit={canUpdate}>
      <AssetDetail
        id={id}
        canUpdate={isEditing}
        canCreateClaim={canCreateClaim}
        canUpdateClaim={canUpdateClaim}
        canDeleteClaim={canDeleteClaim}
        history={history}
      />
    </EditModeProvider>
  );
}
