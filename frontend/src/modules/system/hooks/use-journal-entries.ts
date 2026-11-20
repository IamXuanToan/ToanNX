"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { journalKeys } from "../constants/query-keys";
import { journalEntryService } from "../services/journal-entry.service";
import type { JournalFilters } from "../types/journal-entry.types";

/**
 * Lấy danh sách nhật ký toàn hệ thống theo bộ lọc và phân trang.
 *
 * @param filters - Bộ lọc và phân trang.
 * @returns Truy vấn React Query danh sách nhật ký.
 */
export function useJournalEntries(filters: JournalFilters) {
  return useListQuery(journalKeys.entries(filters), (signal) =>
    journalEntryService.list(filters, signal),
  );
}
