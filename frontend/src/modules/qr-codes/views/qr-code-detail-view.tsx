"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/auth/hooks/use-permission";

import { QrCodeProfile } from "../components/qr-code-profile/qr-code-profile";
import { QR_CODES_PERMISSIONS } from "../constants/qr-codes-permissions";

/**
 * Trang chi tiết mã QR.
 *
 * @param props - Id và slot lịch sử thay đổi.
 * @returns Giao diện chi tiết.
 */
export function QrCodeDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canUpdate = usePermission(QR_CODES_PERMISSIONS.update);
  return <QrCodeProfile id={id} canUpdate={canUpdate} history={history} />;
}
