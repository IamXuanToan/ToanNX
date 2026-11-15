"use client";

import type { Editor } from "@tiptap/react";
import { QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { useTiptapInsertItem } from "@/shares/components/common/tiptap-editor/hooks/use-tiptap-plugins";

import { QrCodePicker } from "../components/qr-code-picker/qr-code-picker";
import { QR_CODES_PERMISSIONS } from "../constants/qr-codes-permissions";

/** Mục "Mã QR" trong menu Chèn (chỉ đăng ký khi có quyền xem mã QR). */
function QrCodeInsert() {
  const t = useTranslations("qrCodes.picker");
  const [editor, setEditor] = useState<Editor | null>(null);
  useTiptapInsertItem({ key: "qr-code", label: t("insert"), icon: QrCode, run: setEditor });
  return (
    <QrCodePicker
      open={editor !== null}
      onOpenChange={(open) => !open && setEditor(null)}
      onPick={(code) => {
        // Mã QR = ảnh trong Thư viện: lưu attachmentId để BE dựng URL hiện tại (sửa mã QR → ảnh tự cập nhật).
        editor
          ?.chain()
          .focus()
          .insertContent({
            type: "image",
            attrs: { src: code.image.url, alt: code.name, attachmentId: code.image.id },
          })
          .run();
        setEditor(null);
      }}
    />
  );
}

/**
 * Plugin editor của module QR: page ghép vào editor của module khác (Custom Pages) qua slot; chèn mã QR là chèn
 * **ảnh** của mã QR đã tạo ở trang Mã QR.
 *
 * @returns Plugin (không render gì khi không có quyền).
 */
export function QrCodeTiptapPlugin() {
  const canRead = usePermission(QR_CODES_PERMISSIONS.read);
  return canRead ? <QrCodeInsert /> : null;
}
