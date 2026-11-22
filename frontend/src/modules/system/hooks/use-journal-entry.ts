"use client";

import { useQuery } from "@tanstack/react-query";

import { journalKeys } from "../constants/query-keys";
import { journalEntryService } from "../services/journal-entry.service";

/**
 * Lấy chi tiết một mục nhật ký.
 *
 * @param id - Id mục nhật ký.
 * @returns Truy vấn React Query một mục nhật ký.
 */
export function useJournalEntry(id: string) {
  return useQuery({
    queryKey: journalKeys.entry(id),
    queryFn: ({ signal }) => journalEntryService.get(id, signal),
  });
}
