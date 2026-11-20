"use client";

import { useQuery } from "@tanstack/react-query";

import { journalKeys } from "../constants/query-keys";
import { journalEntryService } from "../services/journal-entry.service";

/**
 * Lấy lịch sử thay đổi của một bản ghi cụ thể.
 *
 * @param path - Đường dẫn API lấy lịch sử (`…/{id}/history`).
 * @param enabled - Có quyền đọc bản ghi hay không.
 * @returns Truy vấn React Query lịch sử của bản ghi.
 */
export function useRecordHistory(path: string, enabled = true) {
  return useQuery({
    queryKey: journalKeys.record(path),
    queryFn: ({ signal }) => journalEntryService.forRecord(path, signal),
    enabled,
  });
}
