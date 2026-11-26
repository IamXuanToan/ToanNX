"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { WarrantyClaimDetail } from "../../components/asset-warranty-claim/warranty-claim-detail";
import { ASSET_WARRANTY_CLAIM_PERMISSIONS } from "../../permissions/asset-warranty-claim-permission";

/** @param props - ID phiếu bảo hành và slot lịch sử. @returns Trang chi tiết Phiếu bảo hành. */
export function WarrantyClaimDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(ASSET_WARRANTY_CLAIM_PERMISSIONS.read);
  const canUpdate = usePermission(ASSET_WARRANTY_CLAIM_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) return <ForbiddenView />;

  return (
    <EditModeProvider canEdit={canUpdate}>
      <WarrantyClaimDetail id={id} canUpdate={isEditing} history={history} />
    </EditModeProvider>
  );
}
