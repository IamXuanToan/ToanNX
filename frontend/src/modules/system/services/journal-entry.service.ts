import { apiClient } from "@/shares/lib/api/api-client";
import type { HistoryEntry, Paginated } from "@/shares/types/api.types";
import { toPaginated } from "@/shares/lib/api/to-paginated";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { JournalEntry, JournalFilters, JournalResource } from "../types/journal-entry.types";

/** Service nhật ký (BE `system/services/journal_entry_service.py`): đọc và xóa (xóa hẳn). */
export const journalEntryService = {
  /** Một trang nhật ký; `changes` giữ nguyên tên field của BE. */
  async list(filters: JournalFilters, signal?: AbortSignal): Promise<Paginated<JournalEntry>> {
    return toPaginated(
      await apiClient.get<JournalEntry[]>(SYSTEM_API_ENDPOINTS.journalEntries, {
        query: filters,
        signal,
        opaqueKeys: ["changes"],
      }),
    );
  },
  /** Một mục nhật ký (`changes` giữ nguyên tên field của BE). */
  async get(id: string, signal?: AbortSignal): Promise<JournalEntry> {
    return (
      await apiClient.get<JournalEntry>(`${SYSTEM_API_ENDPOINTS.journalEntries}/${id}`, {
        signal,
        opaqueKeys: ["changes"],
      })
    ).data;
  },

  /** Xóa hẳn một mục nhật ký. */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${SYSTEM_API_ENDPOINTS.journalEntries}/${id}`);
  },

  /** @returns Số mục đã xóa hẳn. */
  async bulkDelete(ids: string[]): Promise<number> {
    return (
      await apiClient.post<{ count: number }>(
        `${SYSTEM_API_ENDPOINTS.journalEntries}/bulk-delete`,
        {
          ids,
        },
      )
    ).data.count;
  },

  /** @returns Các `module.model` đang ghi lịch sử (không phân trang). */
  async resources(signal?: AbortSignal): Promise<JournalResource[]> {
    return (
      await apiClient.get<JournalResource[]>(SYSTEM_API_ENDPOINTS.journalResources, {
        signal,
        opaqueKeys: ["fieldLabels"],
      })
    ).data;
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

  /**
   * Lịch sử phân trang của một bản ghi phục vụ tải thêm ("Xem hoạt động cũ hơn").
   *
   * @param path - `…/{id}/history` của tài nguyên.
   * @param params - Số trang và kích thước trang.
   * @param signal - Tín hiệu hủy.
   * @returns Kết quả phân trang lịch sử thay đổi.
   */
  async forRecordPage(
    path: string,
    params: { page?: number; pageSize?: number },
    signal?: AbortSignal,
  ): Promise<Paginated<HistoryEntry>> {
    return toPaginated(
      await apiClient.get<HistoryEntry[]>(path, {
        query: params,
        signal,
        opaqueKeys: ["changes"],
      }),
    );
  },
};
