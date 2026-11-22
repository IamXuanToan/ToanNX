"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";

import { QR_CODE_PERMISSIONS } from "../permissions/qr-code-permission";
import { QrCodeInsert } from "../components/qr-code-insert";

/**
 * Plugin editor mã QR: `PageForm` ghép vào editor trang tùy chỉnh; chèn mã QR là chèn
 * **ảnh** của mã QR đã tạo ở trang Mã QR.
 *
 * @returns Plugin (không render gì khi không có quyền).
 */
export function QrCodeTiptapPlugin() {
  const canRead = usePermission(QR_CODE_PERMISSIONS.read);
  return canRead ? <QrCodeInsert /> : null;
}
