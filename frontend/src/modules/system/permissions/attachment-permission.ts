import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/**
 * Quyền hạn đối với tài nguyên tệp tin (Attachment).
 *
 * Khớp chuẩn định danh quyền của backend `AttachmentPermission`.
 */
export const ATTACHMENT_PERMISSIONS = createResourcePermissions(SYSTEM_SCOPE, "attachment", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  delete: PERMISSION_ACTION.delete,
  manageAll: PERMISSION_ACTION.manageAll,
  readPrivate: PERMISSION_ACTION.readPrivate,
  update: PERMISSION_ACTION.update,
});
