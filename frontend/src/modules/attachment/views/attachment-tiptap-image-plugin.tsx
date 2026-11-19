"use client";

import type { Editor } from "@tiptap/react";
import { ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { useTiptapInsertItem } from "@/shares/components/common/tiptap-editor/hooks/use-tiptap-plugins";

import { AttachmentPicker } from "../components/attachment-picker/attachment-picker";
import { ATTACHMENT_PERMISSIONS } from "../permissions/attachment-permission";

/** Mục "Ảnh từ Thư viện" trong menu Chèn; lưu `attachmentId` để BE dựng URL theo file hiện tại. */
function LibraryImageInsert({ canUpload }: { canUpload: boolean }) {
  const t = useTranslations("attachment");
  const [editor, setEditor] = useState<Editor | null>(null);
  useTiptapInsertItem({
    key: "library-image",
    label: t("editorInsert"),
    icon: ImagePlus,
    run: setEditor,
  });
  if (!editor) return null;
  return (
    <AttachmentPicker
      canUpload={canUpload}
      onClose={() => setEditor(null)}
      onSelect={(file) => {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "image",
            attrs: { src: file.url, alt: file.originalName, attachmentId: file.id },
          })
          .run();
        setEditor(null);
      }}
    />
  );
}

/**
 * Plugin editor: chọn ảnh đã có trong Thư viện. Đặt trong `TiptapPluginContext` của editor.
 *
 * @returns Plugin (không render gì khi không có quyền xem file).
 */
export function AttachmentTiptapImagePlugin() {
  const canRead = usePermission(ATTACHMENT_PERMISSIONS.read);
  const canUpload = usePermission(ATTACHMENT_PERMISSIONS.create);
  return canRead ? <LibraryImageInsert canUpload={canUpload} /> : null;
}
