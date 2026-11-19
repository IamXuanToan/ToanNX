"use client";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { JournalEntryDetail } from "../components/journal-entry-detail/journal-entry-detail";
import { JOURNAL_ENTRY_PERMISSIONS } from "../permissions/journal-entry-permission";

/**
 * Trang chi tiết một mục nhật ký: field nào đổi từ giá trị nào sang giá trị nào.
 *
 * @param props - Id mục nhật ký.
 * @returns Giao diện chi tiết hoặc màn không có quyền.
 */
export function JournalEntryDetailView({ id }: { id: string }) {
  const canRead = usePermission(JOURNAL_ENTRY_PERMISSIONS.entryRead);
  if (!canRead) return <ForbiddenView />;
  return <JournalEntryDetail id={id} />;
}
