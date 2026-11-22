/**
 * Mã quyền hạn của tài nguyên Nhật ký hệ thống (JournalEntry).
 *
 * Khớp backend `JournalEntryPermission`.
 */
export const JOURNAL_ENTRY_PERMISSIONS = {
  entryRead: "system.journal_entry.read",
  entryDelete: "system.journal_entry.delete",
} as const;
