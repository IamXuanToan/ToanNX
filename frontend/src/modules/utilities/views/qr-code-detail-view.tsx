"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { QrCodeProfile } from "../components/qr-code-profile";
import { QR_CODE_PERMISSIONS } from "../permissions/qr-code-permission";

/**
 * Trang chi tiết mã QR.
 *
 * @param props - Id và slot lịch sử thay đổi.
 * @returns Giao diện chi tiết.
 */
export function QrCodeDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(QR_CODE_PERMISSIONS.read);
  const canUpdate = usePermission(QR_CODE_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);
  if (!canRead) return <ForbiddenView />;
  return (
    <EditModeProvider canEdit={canUpdate}>
      <QrCodeProfile id={id} canUpdate={isEditing} history={history} />
    </EditModeProvider>
  );
}
