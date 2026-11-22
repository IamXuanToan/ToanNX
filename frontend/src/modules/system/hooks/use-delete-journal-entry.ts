"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { journalKeys } from "../constants/query-keys";
import { journalEntryService } from "../services/journal-entry.service";

/** @returns Mutation xóa hẳn một mục nhật ký thay đổi. */
export function useDeleteJournalEntry() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => journalEntryService.delete(id),
    invalidate: [journalKeys.all],
    success: "deleted",
  });
}
