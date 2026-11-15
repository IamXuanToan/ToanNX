"use client";

import { useFormatter, useNow, useTranslations } from "next-intl";

import type { ActivityItem } from "@/shares/components/common/activity-timeline/activity-timeline";
import { useMessage } from "@/shares/hooks/use-message";
import type { HistoryEntry } from "@/shares/types/api.types";
import type { MessageKey } from "@/shares/types/navigation.types";

const MASK = "***";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/;

const camel = (value: string) =>
  value.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());

/**
 * Đổi mục lịch sử của BE thành dòng hiển thị: hành động đã dịch, nhãn field theo namespace của module
 * (`<fieldPrefix>.<field camelCase>`, thiếu thì dùng tên field), giá trị đã định dạng.
 *
 * @param entries - Lịch sử (mới nhất trước).
 * @param fieldPrefix - Tiền tố khóa dịch nhãn field, ví dụ `account.users.fields`.
 * @returns Hàm dựng dòng cho `ActivityTimeline`.
 */
export function useRecordHistoryItems(
  entries: HistoryEntry[] | undefined,
  fieldPrefix: MessageKey,
) {
  const t = useTranslations("journal");
  const message = useMessage();
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });

  const value = (raw: unknown): string => {
    if (raw === null || raw === undefined || raw === "") return "—";
    if (raw === MASK) return t("masked");
    if (typeof raw === "boolean") return raw ? t("yes") : t("no");
    if (typeof raw === "string" && ISO_DATE.test(raw)) {
      return format.dateTime(new Date(raw), { dateStyle: "medium", timeStyle: "short" });
    }
    if (typeof raw === "object") return JSON.stringify(raw).slice(0, 120);
    return String(raw);
  };

  const action = (entry: HistoryEntry): string => {
    if (entry.action !== "EVENT") return t(`actions.${entry.action}`);
    const key = `journal.events.${entry.event.replace(/\./g, "_")}` as MessageKey;
    const text = message(key);
    return text === key ? entry.event : text;
  };

  const items: ActivityItem[] = (entries ?? []).map((entry) => ({
    id: entry.id,
    dateTime: entry.createdAt,
    time: format.relativeTime(new Date(entry.createdAt), now),
    actor: entry.actorLabel || t("system"),
    action: action(entry),
    changes: Object.entries(entry.changes).map(([field, [before, after]]) => {
      const key = `${fieldPrefix}.${camel(field)}` as MessageKey;
      const label = message(key);
      return { field: label === key ? field : label, before: value(before), after: value(after) };
    }),
  }));
  return items;
}
