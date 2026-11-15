import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";
import type { HistoryEntry, Paginated } from "@/shares/types/api.types";
import { toPaginated } from "@/shares/lib/api/to-paginated";

import { JOURNAL_API_ENDPOINTS } from "../constants/api-endpoints";
import type { JournalEntry, JournalFilters, JournalResource } from "../types/journal.types";

const crud = createCrudService<JournalEntry, JournalFilters>(JOURNAL_API_ENDPOINTS.entries);

/** Service nhật ký (BE `journal/services/journal_entry_service.py`, chỉ đọc). */
export const journalEntryService = {
  /** Một trang nhật ký; `changes` giữ nguyên tên field của BE. */
  async list(filters: JournalFilters, signal?: AbortSignal): Promise<Paginated<JournalEntry>> {
    return toPaginated(
      await apiClient.get<JournalEntry[]>(JOURNAL_API_ENDPOINTS.entries, {
        query: filters,
        signal,
        opaqueKeys: ["changes"],
      }),
    );
  },
  get: crud.get,

  /** @returns Các `module.model` đang ghi lịch sử (không phân trang). */
  async resources(signal?: AbortSignal): Promise<JournalResource[]> {
    return (await apiClient.get<JournalResource[]>(JOURNAL_API_ENDPOINTS.resources, { signal }))
      .data;
  },

  /**
   * Lịch sử của một bản ghi qua action `history` của chính tài nguyên đó (quyền theo quyền đọc bản ghi).
   *
   * @param path - `…/{id}/history` do page dựng từ endpoint của module sở hữu bản ghi.
   * @param signal - Tín hiệu hủy.
   * @returns Lịch sử, mới nhất trước.
   */
  async forRecord(path: string, signal?: AbortSignal): Promise<HistoryEntry[]> {
    return (await apiClient.get<HistoryEntry[]>(path, { signal, opaqueKeys: ["changes"] })).data;
  },
};
