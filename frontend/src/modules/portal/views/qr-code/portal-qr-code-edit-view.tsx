"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { QR_CODE_PERMISSIONS } from "@/modules/utilities/permissions/qr-code-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PortalQrCodeEdit } from "../../components/qr-code/portal-qr-code-edit";

/**
 * View chỉnh sửa mã QR trong Client Portal.
 *
 * @param props - ID mã QR cần sửa.
 * @returns View chỉnh sửa mã QR.
 */
export function PortalQrCodeEditView({ id }: { id: string }) {
  const canRead = usePermission(QR_CODE_PERMISSIONS.read);
  const canUpdate = usePermission(QR_CODE_PERMISSIONS.update);

  if (!canRead) {
    return <ForbiddenView />;
  }

  return <PortalQrCodeEdit id={id} canUpdate={canUpdate} />;
}
