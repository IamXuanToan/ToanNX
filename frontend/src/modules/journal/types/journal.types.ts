import type { HistoryEntry, ListParams } from "@/shares/types/api.types";

/** Một mục nhật ký (cùng hình dạng với lịch sử của từng bản ghi). */
export type JournalEntry = HistoryEntry;

/** Tài nguyên đang ghi lịch sử (`GET /journal/resources`), dùng làm lựa chọn lọc module.model. */
export type JournalResource = {
  resource: string;
  module: string;
  model: string;
  name: string;
};

export const JOURNAL_ACTIONS = ["CREATE", "UPDATE", "DELETE", "EVENT"] as const;

/** Bộ lọc nhật ký (BE `JournalEntryFilter`, nhiều giá trị). */
export type JournalFilters = ListParams & {
  resource?: string[];
  action?: (typeof JOURNAL_ACTIONS)[number][];
  actor?: string[];
  objectId?: string;
};
