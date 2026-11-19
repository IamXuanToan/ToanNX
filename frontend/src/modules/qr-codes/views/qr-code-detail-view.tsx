"use client";

import type { ReactNode } from "react";
import type { QrLogoUpload } from "../components/qr-code-form/qr-code-form";

import { usePermission } from "@/modules/auth/hooks/use-permission";

import { QrCodeProfile } from "../components/qr-code-profile/qr-code-profile";
import { QR_CODE_PERMISSIONS } from "../permissions/qr-code-permission";

/**
 * Trang chi tiết mã QR.
 *
 * @param props - Id và slot lịch sử thay đổi.
 * @returns Giao diện chi tiết.
 */
export function QrCodeDetailView({
  id,
  history,
  LogoUpload,
}: {
  id: string;
  history?: ReactNode;
  LogoUpload: QrLogoUpload;
}) {
  const canUpdate = usePermission(QR_CODE_PERMISSIONS.update);
  return <QrCodeProfile id={id} canUpdate={canUpdate} history={history} LogoUpload={LogoUpload} />;
}
