"use client";

import { usePermission } from "@/modules/auth/hooks/use-permission";

import { QrCodePicker } from "../components/qr-code-picker";
import { QR_CODE_PERMISSIONS } from "../permissions/qr-code-permission";
import { useQrCodeInsert } from "./hooks/use-qr-code-insert";

/** Mục "Mã QR" trong menu Chèn (chỉ đăng ký khi có quyền xem mã QR). */
function QrCodeInsert() {
  const { isOpen, close, handlePick } = useQrCodeInsert();

  return (
    <QrCodePicker open={isOpen} onOpenChange={(open) => !open && close()} onPick={handlePick} />
  );
}

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
