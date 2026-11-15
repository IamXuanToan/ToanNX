"use client";

import { useQuery } from "@tanstack/react-query";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { journalKeys } from "../constants/query-keys";
import { journalEntryService } from "../services/journal-entry.service";
import type { JournalFilters } from "../types/journal.types";

/** @param filters - Bộ lọc và phân trang. @returns Nhật ký toàn hệ thống. */
export function useJournalEntries(filters: JournalFilters) {
  return useListQuery(journalKeys.entries(filters), (signal) =>
    journalEntryService.list(filters, signal),
  );
}

/** @param id - Id mục nhật ký. @returns Một mục nhật ký. */
export function useJournalEntry(id: string) {
  return useQuery({
    queryKey: journalKeys.entry(id),
    queryFn: ({ signal }) => journalEntryService.get(id, signal),
  });
}

/** @param enabled - Có quyền xem nhật ký. @returns Danh mục `module.model` (tĩnh trong phiên). */
export function useJournalResources(enabled = true) {
  return useQuery({
    queryKey: journalKeys.resources(),
    queryFn: ({ signal }) => journalEntryService.resources(signal),
    staleTime: Infinity,
    enabled,
  });
}

/** @param path - `…/{id}/history`. @param enabled - Có quyền đọc bản ghi. @returns Lịch sử của bản ghi. */
export function useRecordHistory(path: string, enabled = true) {
  return useQuery({
    queryKey: journalKeys.record(path),
    queryFn: ({ signal }) => journalEntryService.forRecord(path, signal),
    enabled,
  });
}
