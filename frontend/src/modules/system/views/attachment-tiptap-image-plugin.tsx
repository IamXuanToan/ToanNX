"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";

import { AttachmentPicker } from "../components/attachment-picker";
import { ATTACHMENT_PERMISSIONS } from "../permissions/attachment-permission";
import { useLibraryImageInsert } from "./hooks/use-library-image-insert";

/** Mục "Ảnh từ Thư viện" trong menu Chèn; lưu `attachmentId` để BE dựng URL theo file hiện tại. */
function LibraryImageInsert({ canUpload }: { canUpload: boolean }) {
  const { isOpen, close, handleSelect } = useLibraryImageInsert();

  if (!isOpen) return null;
  return <AttachmentPicker canUpload={canUpload} onClose={close} onSelect={handleSelect} />;
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
