import { format, formatDistanceStrict, isValid, parseISO } from "date-fns";

import { DEFAULT_LOCALE_CODE } from "@/shares/constants/locale";
import { getDateFnsLocale } from "@/shares/lib/date-fns-locale";

/** Mẫu hiển thị ngày thuần chuẩn hệ thống (`dd/MM/yyyy`). */
export const EXPLICIT_DATE_FORMAT = "dd/MM/yyyy";

/** Mẫu hiển thị ngày giờ rõ ràng kèm giây (`dd/MM/yyyy HH:mm:ss`). */
export const EXPLICIT_DATE_TIME_FORMAT = "dd/MM/yyyy HH:mm:ss";

/** Giá trị đầu vào ngày giờ hỗ trợ chuẩn hóa. */
export type DateInputValue = Date | string | number | null | undefined;

/**
 * Tùy chọn định dạng thời gian kèm khoảng đếm tương đối (`6 giây trước`).
 */
export type DateTimeRelativeOptions = {
  /** Mốc thời gian hiện tại (ưu tiên lấy từ `useNow()` của `next-intl` để đồng bộ SSR/CSR). */
  now?: Date;
  /** Locale hiện tại (dùng khi fallback sang `date-fns`). */
  locale?: string;
  /** Hàm tính chuỗi thời gian tương đối (ưu tiên `format.relativeTime` của `next-intl`). */
  relativeFormatter?: (date: Date, now: Date) => string;
  /** Nhãn trạng thái thay thế cho phần tương đối trong ngoặc (ví dụ: `Đang trực tuyến`). */
  customStatusLabel?: string;
};

/**
 * Chuyển giá trị đầu vào (Date, ISO string, timestamp ms) sang `Date` hợp lệ hoặc `null`.
 *
 * @param value - Giá trị ngày giờ thô từ API hoặc state.
 * @returns Đối tượng `Date` hợp lệ, hoặc `null` nếu rỗng/không hợp lệ.
 */
export function parseDateValue(value: DateInputValue): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    return isValid(parsed) ? parsed : null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const isoParsed = parseISO(trimmed);
  if (isValid(isoParsed)) return isoParsed;
  const fallback = new Date(trimmed);
  return isValid(fallback) ? fallback : null;
}

/**
 * Định dạng ngày thuần theo mẫu chuẩn `dd/MM/yyyy` (dùng cho cột chỉ có ngày như hạn, ngày phát hành).
 *
 * @param value - Giá trị ngày đầu vào.
 * @param fallback - Chuỗi thay thế khi thiếu hoặc không hợp lệ.
 * @returns Chuỗi `dd/MM/yyyy` hoặc `fallback`.
 */
export function formatExplicitDate(value: DateInputValue, fallback = "—"): string {
  const date = parseDateValue(value);
  if (!date) return fallback;
  return format(date, EXPLICIT_DATE_FORMAT);
}

/**
 * Định dạng mốc thời gian đầy đủ theo mẫu `dd/MM/yyyy HH:mm:ss`.
 *
 * @param value - Giá trị ngày giờ đầu vào.
 * @param fallback - Chuỗi thay thế khi thiếu hoặc không hợp lệ.
 * @returns Chuỗi `dd/MM/yyyy HH:mm:ss` hoặc `fallback`.
 */
export function formatExplicitDateTime(value: DateInputValue, fallback = "—"): string {
  const date = parseDateValue(value);
  if (!date) return fallback;
  return format(date, EXPLICIT_DATE_TIME_FORMAT);
}

/**
 * Tính chuỗi khoảng thời gian tương đối (`6 giây trước`, `2 ngày trước`) cho một mốc `Date`.
 *
 * @param date - Thời điểm cần tính.
 * @param options - Mốc `now`, `locale` và hàm `relativeFormatter` tùy chọn.
 * @returns Chuỗi thời gian đếm tương đối.
 */
export function formatRelativeTimeLabel(
  date: Date,
  options?: Omit<DateTimeRelativeOptions, "customStatusLabel">,
): string {
  const baseNow = options?.now ?? new Date();
  if (options?.relativeFormatter) {
    const formatted = options.relativeFormatter(date, baseNow);
    if (formatted) return formatted;
  }
  return formatDistanceStrict(date, baseNow, {
    addSuffix: true,
    locale: getDateFnsLocale(options?.locale ?? DEFAULT_LOCALE_CODE),
  });
}

/**
 * Định dạng mốc thời gian theo chuẩn hệ thống: `dd/MM/yyyy HH:mm:ss (thời gian đếm)`,
 * ví dụ `27/11/2026 13:24:05 (6 giây trước)`.
 *
 * @param value - Giá trị ngày giờ đầu vào.
 * @param options - Tùy chọn tính phần đếm tương đối hoặc trạng thái tùy biến.
 * @returns Chuỗi ngày giờ đầy đủ kèm thời gian đếm trong ngoặc, hoặc `"—"` nếu rỗng.
 */
export function formatDateTimeWithRelative(
  value: DateInputValue,
  options?: DateTimeRelativeOptions,
): string {
  const date = parseDateValue(value);
  if (!date) return "—";
  const absolute = format(date, EXPLICIT_DATE_TIME_FORMAT);
  const relative = options?.customStatusLabel?.trim() || formatRelativeTimeLabel(date, options);
  return relative ? `${absolute} (${relative})` : absolute;
}
