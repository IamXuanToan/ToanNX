"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ATTACHMENT_PERMISSIONS } from "../../permissions/attachment-permission";
import { LibraryImageInsert } from "../../components/attachment/library-image-insert";

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
