"use client";

import { AttachmentPicker } from "./attachment-picker";
import { useLibraryImageInsert } from "./hooks/use-library-image-insert";

/** Mục "Ảnh từ Thư viện" trong menu Chèn; lưu `attachmentId` để BE dựng URL theo file hiện tại. */
export function LibraryImageInsert({ canUpload }: { canUpload: boolean }) {
  const { isOpen, close, handleSelect } = useLibraryImageInsert();

  if (!isOpen) return null;
  return <AttachmentPicker canUpload={canUpload} onClose={close} onSelect={handleSelect} />;
}
