"use client";

import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";

import { useJournalEntries, useJournalResources } from "../../../hooks/use-journal";
import { JOURNAL_ACTIONS } from "../../../types/journal.types";

/**
 * State bảng nhật ký: tìm (tên bản ghi, người làm), lọc `module.model` và hành động (chọn nhiều), phân trang URL.
 *
 * @returns Truy vấn, danh mục tài nguyên và state bảng.
 */
export function useJournalTable() {
  const table = useTableState({ ordering: "-created_at", filterKeys: ["resource", "action"] });
  const resources = useJournalResources();
  const resource = table.getFilterValues("resource");
  const query = useJournalEntries({
    ...table.filters,
    resource: resource.length ? resource : undefined,
    action: pickAllowedValues(table.getFilterValues("action"), JOURNAL_ACTIONS),
  });
  const resourceName = new Map((resources.data ?? []).map((item) => [item.resource, item.name]));
  return { table, query, resources, resourceName };
}
