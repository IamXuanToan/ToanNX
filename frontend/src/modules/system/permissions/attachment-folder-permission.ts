import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/**
 * Quyền hạn đối với tài nguyên Thư mục (AttachmentFolder).
 *
 * Khớp chuẩn định danh quyền của backend `AttachmentFolderPermission`.
 */
export const ATTACHMENT_FOLDER_PERMISSIONS = createResourcePermissions(
  SYSTEM_SCOPE,
  "attachment_folder",
  {
    folderRead: PERMISSION_ACTION.read,
    folderCreate: PERMISSION_ACTION.create,
    folderUpdate: PERMISSION_ACTION.update,
    folderDelete: PERMISSION_ACTION.delete,
  },
);
