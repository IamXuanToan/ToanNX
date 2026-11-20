"use client";

import { useRouter } from "@/i18n/navigation";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";

import { JOURNAL_FIELD_PREFIXES } from "../../constants/journal-field-prefixes";
import { SYSTEM_ROUTES } from "../../constants/routes";
import { useJournalEntries } from "../../hooks/use-journal-entries";
import { useJournalFormat } from "../../hooks/use-journal-format";
import { useJournalResources } from "../../hooks/use-journal-resources";
import { JOURNAL_ACTIONS, type JournalEntry } from "../../types/journal-entry.types";

/** Số field hiện ngay trong bảng; phần còn lại xem ở trang chi tiết. */
const SUMMARY_FIELDS = 2;

/**
 * State bảng nhật ký: tìm (tên bản ghi, người làm, id bản ghi), lọc `module.model` và hành động (chọn nhiều),
 * phân trang URL, tóm tắt "field: cũ → mới" và mở trang chi tiết.
 *
 * @returns Truy vấn, danh mục tài nguyên, state bảng, tóm tắt thay đổi, mở chi tiết.
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
  const router = useRouter();
  const journal = useJournalFormat();
  const resourceName = new Map((resources.data ?? []).map((item) => [item.resource, item.name]));
  const fieldLabels = new Map(
    (resources.data ?? []).map((item) => [item.resource, item.fieldLabels]),
  );

  /** Tối đa `SUMMARY_FIELDS` dòng "Nhãn: cũ → mới" và số field còn lại. */
  const summarize = (entry: JournalEntry) => {
    const all = Object.entries(entry.changes);
    const lines = all.slice(0, SUMMARY_FIELDS).map(([field, [before, after]]) => ({
      field,
      label: journal.fieldLabel(
        field,
        JOURNAL_FIELD_PREFIXES[entry.resource],
        fieldLabels.get(entry.resource)?.[field],
      ),
      before: journal.value(before, 40),
      after: journal.value(after, 40),
    }));
    return { lines, more: Math.max(all.length - SUMMARY_FIELDS, 0) };
  };

  const openDetail = (entry: JournalEntry) =>
    router.push(SYSTEM_ROUTES.journalEntryDetail(entry.id));
  return { table, query, resources, resourceName, summarize, openDetail };
}
