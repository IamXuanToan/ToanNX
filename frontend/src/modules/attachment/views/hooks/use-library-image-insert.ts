"use client";

import type { Editor } from "@tiptap/react";
import { ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useTiptapInsertItem } from "@/shares/components/common/hooks/use-tiptap-plugins";
import type { Attachment } from "../../types/attachment.types";

/**
 * Hook quản lý đăng ký menu "Ảnh từ Thư viện" trong Tiptap insert menu và chèn ảnh vào editor.
 *
 * @returns Editor instance hiện tại, trạng thái hiển thị picker và hàm xử lý khi chọn file ảnh.
 */
export function useLibraryImageInsert() {
  const t = useTranslations("attachment");
  const [editor, setEditor] = useState<Editor | null>(null);

  useTiptapInsertItem({
    key: "library-image",
    label: t("editorInsert"),
    icon: ImagePlus,
    run: setEditor,
  });

  const handleSelect = (file: Attachment) => {
    editor
      ?.chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: {
          src: file.url,
          alt: file.altText || file.originalName,
          attachmentId: file.id,
        },
      })
      .run();
    setEditor(null);
  };

  return {
    isOpen: editor !== null,
    close: () => setEditor(null),
    handleSelect,
  };
}
