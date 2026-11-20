"use client";

import type { Editor } from "@tiptap/react";
import { QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useTiptapInsertItem } from "@/shares/components/common/hooks/use-tiptap-plugins";
import type { QrCode as QrCodeModel } from "../../types/qr-code.types";

/**
 * Hook quản lý đăng ký mục "Mã QR" trong Tiptap insert menu và chèn ảnh mã QR vào nội dung editor.
 *
 * @returns Editor instance hiện tại, trạng thái dialog mở và hàm xử lý khi chọn mã QR.
 */
export function useQrCodeInsert() {
  const t = useTranslations("utilities.qrCodes.picker");
  const [editor, setEditor] = useState<Editor | null>(null);

  useTiptapInsertItem({ key: "qr-code", label: t("insert"), icon: QrCode, run: setEditor });

  const handlePick = (code: QrCodeModel) => {
    editor
      ?.chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: { src: code.image.url, alt: code.name, attachmentId: code.image.id },
      })
      .run();
    setEditor(null);
  };

  return {
    isOpen: editor !== null,
    close: () => setEditor(null),
    handlePick,
  };
}
