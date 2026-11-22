"use client";

import { QrCodePicker } from "./qr-code-picker";
import { useQrCodeInsert } from "./hooks/use-qr-code-insert";

/** Mục "Mã QR" trong menu Chèn (chỉ đăng ký khi có quyền xem mã QR). */
export function QrCodeInsert() {
  const { isOpen, close, handlePick } = useQrCodeInsert();

  return (
    <QrCodePicker open={isOpen} onOpenChange={(open) => !open && close()} onPick={handlePick} />
  );
}
