"use client";

import { useQuery } from "@tanstack/react-query";

import { journalKeys } from "../constants/query-keys";
import { journalEntryService } from "../services/journal-entry.service";

/**
 * Lấy danh mục các module.model đã kích hoạt ghi nhật ký.
 *
 * @param enabled - Có quyền xem nhật ký hay không.
 * @returns Truy vấn React Query danh mục tài nguyên ghi nhật ký.
 */
export function useJournalResources(enabled = true) {
  return useQuery({
    queryKey: journalKeys.resources(),
    queryFn: ({ signal }) => journalEntryService.resources(signal),
    staleTime: Infinity,
    enabled,
  });
}
