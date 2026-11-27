"use client";

import { JOURNAL_FIELD_PREFIXES } from "../../../constants/journal-field-prefixes";
import { useJournalEntry } from "../../../hooks/use-journal-entry";
import { useJournalFormat } from "../../../hooks/use-journal-format";
import { useJournalResources } from "../../../hooks/use-journal-resources";

/**
 * Dữ liệu trang chi tiết một mục nhật ký: mục, tên tài nguyên và từng field đổi kèm nhãn, giá trị cũ/mới,
 * phần thêm/bỏ khi giá trị là danh sách.
 *
 * @param id - Id mục nhật ký.
 * @returns Truy vấn, tên tài nguyên, các dòng thay đổi và hàm định dạng.
 */
export function useJournalEntryDetail(id: string) {
  const query = useJournalEntry(id);
  const resources = useJournalResources();
  const journal = useJournalFormat();
  const entry = query.data;
  const resource = resources.data?.find((item) => item.resource === entry?.resource);
  const fieldPrefix = entry ? JOURNAL_FIELD_PREFIXES[entry.resource] : undefined;
  const changes = Object.entries(entry?.changes ?? {}).map(([field, [before, after]]) => ({
    field,
    fieldPrefix,
    label: journal.fieldLabel(field, fieldPrefix, resource?.fieldLabels[field]),
    before,
    after,
    diff: journal.listDiff(before, after),
  }));
  return { query, entry, resourceName: resource?.name, changes, journal };
}
