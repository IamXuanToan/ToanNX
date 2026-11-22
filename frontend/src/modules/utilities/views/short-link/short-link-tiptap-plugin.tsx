"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";

import { SHORT_LINK_PERMISSIONS } from "../../permissions/short-link-permission";
import { ShortLinkButtonInsert } from "../../components/short-link/short-link-button-insert";

/**
 * Plugin editor: chèn nút trỏ tới link rút gọn của mình. `PageForm` ghép vào editor trang tùy chỉnh.
 *
 * @returns Plugin (không render gì khi không có quyền xem link).
 */
export function ShortLinkTiptapPlugin() {
  const canRead = usePermission(SHORT_LINK_PERMISSIONS.read);
  return canRead ? <ShortLinkButtonInsert /> : null;
}
