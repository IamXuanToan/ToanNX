import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/** Quyền của `TelegramChatPermission` (khớp `app/system/permissions/telegram_chat_permission.py`). */
export const TELEGRAM_CHAT_PERMISSIONS = createResourcePermissions(SYSTEM_SCOPE, "telegram_chat", {
  read: PERMISSION_ACTION.read,
  create: PERMISSION_ACTION.create,
  update: PERMISSION_ACTION.update,
  delete: PERMISSION_ACTION.delete,
  manageAll: PERMISSION_ACTION.manageAll,
});
