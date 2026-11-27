"use client";

import { useTranslations } from "next-intl";

import { useMessage } from "@/shares/hooks/use-message";
import { formatExplicitDate, formatExplicitDateTime } from "@/shares/lib/date-time-format";
import type { HistoryEntry } from "@/shares/types/api.types";
import type { MessageKey } from "@/shares/types/navigation.types";

import { JOURNAL_VALUE_PREFIXES } from "../constants/journal-value-prefixes";

/** Giá trị field nhạy cảm (BE chỉ ghi "đã đổi"). */
export const JOURNAL_MASK = "***";
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T/;
const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const camel = (value: string) =>
  value.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());

/** Phần thêm/bỏ khi giá trị cũ và mới đều là danh sách (vai trò, quyền...). */
export type JournalListDiff = { added: unknown[]; removed: unknown[] };

/** Ngữ cảnh field để dịch giá trị enum chuẩn xác theo tài nguyên. */
export type JournalValueContext = {
  field?: string;
  fieldPrefix?: MessageKey;
};

/**
 * Định dạng chung của Journal cho bảng, trang chi tiết và lịch sử bản ghi: hành động đã dịch, nhãn field,
 * giá trị ngắn gọn (ngày `dd/MM/yyyy`, ngày giờ `dd/MM/yyyy HH:mm:ss`, enum dịch theo ngữ cảnh),
 * phần thêm/bỏ của danh sách.
 *
 * @returns Các hàm định dạng.
 */
export function useJournalFormat() {
  const t = useTranslations("system.journal");
  const message = useMessage();

  const resolveEnumPrefix = (ctx?: JournalValueContext): string | undefined => {
    if (!ctx?.field) return undefined;
    const fieldCamel = camel(ctx.field);
    if (ctx.fieldPrefix) {
      const specific = JOURNAL_VALUE_PREFIXES[`${ctx.fieldPrefix}.${fieldCamel}`];
      if (specific) return specific;
    }
    return JOURNAL_VALUE_PREFIXES[`*.${fieldCamel}`];
  };

  /** Dịch một giá trị đơn (mã enum, ngày thuần, ngày giờ ISO, object/string). */
  const formatSingleItem = (raw: unknown, ctx?: JournalValueContext): string => {
    if (raw === null || raw === undefined || raw === "") return "—";
    if (raw === JOURNAL_MASK) return t("masked");
    if (typeof raw === "boolean") return raw ? t("yes") : t("no");
    if (typeof raw === "string") {
      if (ISO_DATE_TIME.test(raw)) return formatExplicitDateTime(raw);
      if (ISO_DATE_ONLY.test(raw)) return formatExplicitDate(raw);
      const enumPrefix = resolveEnumPrefix(ctx);
      if (enumPrefix && /^[A-Z0-9_]+$/.test(raw)) {
        const enumKey = `${enumPrefix}.${raw}` as MessageKey;
        const translated = message(enumKey);
        if (translated !== enumKey) return translated;
      }
      return raw;
    }
    if (typeof raw === "object") return JSON.stringify(raw);
    return String(raw);
  };

  /** Giá trị một dòng (bảng, lịch sử): JSON dài bị cắt, ngày/giờ chuẩn hóa, enum tự dịch theo field. */
  const value = (raw: unknown, max = 120, ctx?: JournalValueContext): string => {
    if (raw === null || raw === undefined || raw === "") return "—";
    if (raw === JOURNAL_MASK) return t("masked");
    if (typeof raw === "boolean") return raw ? t("yes") : t("no");
    const text = Array.isArray(raw)
      ? raw.map((item) => formatSingleItem(item, ctx)).join(", ")
      : formatSingleItem(raw, ctx);
    return text.length > max ? `${text.slice(0, max)}…` : text || "—";
  };

  /** Hành động đã dịch; sự kiện dịch theo `system.journal.events.<mã>`, chưa dịch thì giữ mã. */
  const action = (entry: Pick<HistoryEntry, "action" | "event">): string => {
    if (entry.action !== "EVENT") return t(`actions.${entry.action}`);
    const key = `system.journal.events.${entry.event.replace(/\./g, "_")}` as MessageKey;
    const text = message(key);
    return text === key ? entry.event : text;
  };

  /** Nhãn badge ngắn phân loại hành động cho timeline. */
  const actionBadge = (entry: Pick<HistoryEntry, "action">): string =>
    t(`actionBadges.${entry.action}`);

  /**
   * Nhãn field: khóa của module → `system.journal.fields.*` → nhãn BE → tên field.
   *
   * @param field - Tên field của BE.
   * @param prefix - Tiền tố khóa dịch của tài nguyên.
   * @param fallback - Nhãn do BE trả.
   * @returns Nhãn.
   */
  const fieldLabel = (field: string, prefix?: MessageKey, fallback?: string): string => {
    const keys = [prefix && `${prefix}.${camel(field)}`, `system.journal.fields.${camel(field)}`];
    for (const key of keys) {
      if (!key) continue;
      const text = message(key as MessageKey);
      if (text !== key) return text;
    }
    return fallback || field;
  };

  /** Phần thêm/bỏ nếu cả hai giá trị là danh sách; ngược lại null. */
  const listDiff = (before: unknown, after: unknown): JournalListDiff | null => {
    const from = before === null || before === undefined ? [] : before;
    if (!Array.isArray(from) || !Array.isArray(after)) return null;
    const key = (item: unknown) => JSON.stringify(item);
    const old = new Set(from.map(key));
    const next = new Set(after.map(key));
    return {
      added: after.filter((item) => !old.has(key(item))),
      removed: from.filter((item) => !next.has(key(item))),
    };
  };

  return { value, formatSingleItem, action, actionBadge, fieldLabel, listDiff };
}
