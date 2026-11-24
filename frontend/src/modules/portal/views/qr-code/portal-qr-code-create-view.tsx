"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { QR_CODE_PERMISSIONS } from "@/modules/utilities/permissions/qr-code-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PortalQrCodeCreate } from "../../components/qr-code/portal-qr-code-create";

/**
 * View tạo mới mã QR trong Client Portal.
 *
 * @returns View tạo mã QR.
 */
export function PortalQrCodeCreateView() {
  const canCreate = usePermission(QR_CODE_PERMISSIONS.create);

  if (!canCreate) {
    return <ForbiddenView />;
  }

  return <PortalQrCodeCreate canCreate={canCreate} />;
}
