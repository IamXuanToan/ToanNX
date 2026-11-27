"use client";

import { useRouter } from "@/i18n/navigation";
import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { pickAllowedValues, useTableState } from "@/shares/hooks/use-table-state";

import { JOURNAL_FIELD_PREFIXES } from "../../../constants/journal-field-prefixes";
import { journalKeys } from "../../../constants/query-keys";
import { SYSTEM_ROUTES } from "../../../constants/routes";
import { useDeleteJournalEntry } from "../../../hooks/use-delete-journal-entry";
import { useJournalEntries } from "../../../hooks/use-journal-entries";
import { useJournalFormat } from "../../../hooks/use-journal-format";
import { useJournalResources } from "../../../hooks/use-journal-resources";
import { journalEntryService } from "../../../services/journal-entry.service";
import { JOURNAL_ACTIONS, type JournalEntry } from "../../../types/journal-entry.types";

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
    const lines = all.slice(0, SUMMARY_FIELDS).map(([field, [before, after]]) => {
      const fieldPrefix = JOURNAL_FIELD_PREFIXES[entry.resource];
      const ctx = { field, fieldPrefix };
      return {
        field,
        label: journal.fieldLabel(field, fieldPrefix, fieldLabels.get(entry.resource)?.[field]),
        before: journal.value(before, 40, ctx),
        after: journal.value(after, 40, ctx),
      };
    });
    return { lines, more: Math.max(all.length - SUMMARY_FIELDS, 0) };
  };

  const remove = useDeleteJournalEntry();
  const bulk = useBulkActions<JournalEntry>({
    service: journalEntryService,
    invalidate: [journalKeys.all],
  });
  return {
    table,
    query,
    resources,
    resourceName,
    summarize,
    view: (entry: JournalEntry) => router.push(SYSTEM_ROUTES.journalEntryDetail(entry.id)),
    remove: (entry: JournalEntry) => remove.mutateAsync(entry.id),
    bulkDelete: bulk.bulkDelete,
  };
}
