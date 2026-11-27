"use client";

import { useTranslations } from "next-intl";

import type { ActivityItem, ActivityTone } from "@/shares/types/activity-timeline.types";
import type { HistoryEntry } from "@/shares/types/api.types";
import type { MessageKey } from "@/shares/types/navigation.types";

import { useJournalFormat } from "../../../hooks/use-journal-format";

const ACTION_TONES: Readonly<Record<HistoryEntry["action"], ActivityTone>> = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  EVENT: "event",
};

/**
 * Đổi các mục lịch sử của BE thành danh sách sự kiện chuẩn `ActivityTimeline`:
 * hành động kèm badge/tông ngữ nghĩa, tác nhân (`fullname (username)` hoặc `Hệ thống`),
 * nhãn field theo namespace module, diff mảng thêm/bỏ và giá trị cũ → mới đã định dạng.
 *
 * @param entries - Danh sách lịch sử (mới nhất trước).
 * @param fieldPrefix - Tiền tố khóa dịch nhãn field, ví dụ `workspace.reminders.fields`.
 * @returns Danh sách `ActivityItem` cho `ActivityTimeline`.
 */
export function useRecordHistoryItems(
  entries: HistoryEntry[] | undefined,
  fieldPrefix: MessageKey,
): ActivityItem[] {
  const t = useTranslations("system.journal");
  const journal = useJournalFormat();

  return (entries ?? []).map((entry) => ({
    id: entry.id,
    dateTime: entry.createdAt,
    actor: entry.actorDisplayName || entry.actorLabel || t("system"),
    isSystem: !entry.actorId,
    action: journal.action(entry),
    actionBadge: journal.actionBadge(entry),
    tone: ACTION_TONES[entry.action] ?? "neutral",
    changes: Object.entries(entry.changes).map(([field, [before, after]]) => {
      const ctx = { field, fieldPrefix };
      const diff = journal.listDiff(before, after);
      return {
        field: journal.fieldLabel(field, fieldPrefix),
        before: journal.value(before, 120, ctx),
        after: journal.value(after, 120, ctx),
        added: diff?.added.map((item) => journal.formatSingleItem(item, ctx)),
        removed: diff?.removed.map((item) => journal.formatSingleItem(item, ctx)),
      };
    }),
  }));
}
