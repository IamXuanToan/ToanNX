"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { QR_CODE_PERMISSIONS } from "@/modules/utilities/permissions/qr-code-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { PortalQrCodeEdit } from "../../components/qr-code/portal-qr-code-edit";

/**
 * View chi tiết và chỉnh sửa mã QR trong Client Portal.
 *
 * @param props - ID mã QR cần xem hoặc sửa và slot lịch sử thay đổi.
 * @returns View chi tiết / chỉnh sửa mã QR.
 */
export function PortalQrCodeEditView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(QR_CODE_PERMISSIONS.read);
  const canUpdate = usePermission(QR_CODE_PERMISSIONS.update);
  const canManageAll = usePermission(QR_CODE_PERMISSIONS.manageAll);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) {
    return <ForbiddenView />;
  }

  return (
    <EditModeProvider canEdit={canUpdate}>
      <PortalQrCodeEdit
        id={id}
        canUpdate={isEditing}
        canManageAll={canManageAll}
        history={history}
      />
    </EditModeProvider>
  );
}
