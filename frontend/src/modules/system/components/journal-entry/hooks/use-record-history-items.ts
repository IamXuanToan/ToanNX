"use client";

import { useFormatter, useNow, useTranslations } from "next-intl";

import type { ActivityItem } from "@/shares/components/common/activity-timeline";
import type { HistoryEntry } from "@/shares/types/api.types";
import type { MessageKey } from "@/shares/types/navigation.types";

import { useJournalFormat } from "../../../hooks/use-journal-format";

/**
 * Đổi mục lịch sử của BE thành dòng hiển thị: hành động đã dịch, nhãn field theo namespace của module
 * (`<fieldPrefix>.<field camelCase>`, thiếu thì dùng tên field), giá trị cũ → mới đã định dạng.
 *
 * @param entries - Lịch sử (mới nhất trước).
 * @param fieldPrefix - Tiền tố khóa dịch nhãn field, ví dụ `system.account.users.fields`.
 * @returns Dòng cho `ActivityTimeline`.
 */
export function useRecordHistoryItems(
  entries: HistoryEntry[] | undefined,
  fieldPrefix: MessageKey,
) {
  const t = useTranslations("system.journal");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const journal = useJournalFormat();

  const items: ActivityItem[] = (entries ?? []).map((entry) => ({
    id: entry.id,
    dateTime: entry.createdAt,
    time: format.relativeTime(new Date(entry.createdAt), now),
    actor: entry.actorLabel || t("system"),
    action: journal.action(entry),
    changes: Object.entries(entry.changes).map(([field, [before, after]]) => ({
      field: journal.fieldLabel(field, fieldPrefix),
      before: journal.value(before),
      after: journal.value(after),
    })),
  }));
  return items;
}
