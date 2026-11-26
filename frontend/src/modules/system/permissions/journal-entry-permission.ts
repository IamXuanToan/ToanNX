import { PERMISSION_ACTION } from "@/shares/constants/permission-actions";
import { createResourcePermissions } from "@/shares/lib/permissions/resource-permissions";

import { SYSTEM_SCOPE } from "../constants/query-keys";

/**
 * Mã quyền hạn của tài nguyên Nhật ký hệ thống (JournalEntry).
 *
 * Khớp backend `JournalEntryPermission`.
 */
export const JOURNAL_ENTRY_PERMISSIONS = createResourcePermissions(SYSTEM_SCOPE, "journal_entry", {
  entryRead: PERMISSION_ACTION.read,
  entryDelete: PERMISSION_ACTION.delete,
});
