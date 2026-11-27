import { formatDistanceStrict, isValid, parseISO } from "date-fns";

import { DEFAULT_LOCALE_CODE, DEFAULT_TIMEZONE } from "@/shares/constants/locale";
import { getDateFnsLocale } from "@/shares/lib/date-fns-locale";

/** Mẫu hiển thị ngày thuần chuẩn hệ thống (`dd/MM/yyyy`). */
export const EXPLICIT_DATE_FORMAT = "dd/MM/yyyy";

/** Mẫu hiển thị ngày giờ rõ ràng kèm giây (`dd/MM/yyyy HH:mm:ss`). */
export const EXPLICIT_DATE_TIME_FORMAT = "dd/MM/yyyy HH:mm:ss";

const ISO_DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateTimePartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let cached = dateTimeFormatterCache.get(timeZone);
  if (!cached) {
    cached = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    dateTimeFormatterCache.set(timeZone, cached);
  }
  return cached;
}

function getFormattedDateParts(date: Date, timeZone: string) {
  const parts = getDateTimePartsFormatter(timeZone).formatToParts(date);
  const map = new Map<string, string>();
  for (const part of parts) {
    if (part.type !== "literal") map.set(part.type, part.value);
  }
  const hour = map.get("hour") === "24" ? "00" : (map.get("hour") ?? "00");
  return {
    day: map.get("day") ?? "01",
    month: map.get("month") ?? "01",
    year: map.get("year") ?? "1970",
    hour,
    minute: map.get("minute") ?? "00",
    second: map.get("second") ?? "00",
  };
}

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
  /** Múi giờ chuẩn IANA để render phần ngày giờ tuyệt đối (mặc định `Asia/Ho_Chi_Minh`). */
  timeZone?: string;
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
 * Chuỗi ngày thuần `YYYY-MM-DD` được giữ nguyên ngày lịch mà không bị dịch múi giờ;
 * mốc có giờ/timezone sẽ quy đổi theo `timeZone` (mặc định `Asia/Ho_Chi_Minh`).
 *
 * @param value - Giá trị ngày đầu vào.
 * @param fallback - Chuỗi thay thế khi thiếu hoặc không hợp lệ.
 * @param timeZone - Múi giờ IANA tham chiếu cho giá trị `Date`/ISO có giờ.
 * @returns Chuỗi `dd/MM/yyyy` hoặc `fallback`.
 */
export function formatExplicitDate(
  value: DateInputValue,
  fallback = "—",
  timeZone = DEFAULT_TIMEZONE,
): string {
  if (typeof value === "string") {
    const dateOnlyMatch = ISO_DATE_ONLY_PATTERN.exec(value.trim());
    if (dateOnlyMatch && parseDateValue(value)) {
      return `${dateOnlyMatch[3]}/${dateOnlyMatch[2]}/${dateOnlyMatch[1]}`;
    }
  }
  const date = parseDateValue(value);
  if (!date) return fallback;
  const { day, month, year } = getFormattedDateParts(date, timeZone);
  return `${day}/${month}/${year}`;
}

/**
 * Định dạng mốc thời gian đầy đủ theo mẫu `dd/MM/yyyy HH:mm:ss` trong `timeZone` chuẩn.
 *
 * @param value - Giá trị ngày giờ đầu vào.
 * @param fallback - Chuỗi thay thế khi thiếu hoặc không hợp lệ.
 * @param timeZone - Múi giờ IANA tham chiếu (mặc định `Asia/Ho_Chi_Minh`).
 * @returns Chuỗi `dd/MM/yyyy HH:mm:ss` hoặc `fallback`.
 */
export function formatExplicitDateTime(
  value: DateInputValue,
  fallback = "—",
  timeZone = DEFAULT_TIMEZONE,
): string {
  const date = parseDateValue(value);
  if (!date) return fallback;
  const { day, month, year, hour, minute, second } = getFormattedDateParts(date, timeZone);
  return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
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
 * @param options - Tùy chọn tính phần đếm tương đối, múi giờ hoặc trạng thái tùy biến.
 * @returns Chuỗi ngày giờ đầy đủ kèm thời gian đếm trong ngoặc, hoặc `"—"` nếu rỗng.
 */
export function formatDateTimeWithRelative(
  value: DateInputValue,
  options?: DateTimeRelativeOptions,
): string {
  const date = parseDateValue(value);
  if (!date) return "—";
  const absolute = formatExplicitDateTime(date, "—", options?.timeZone ?? DEFAULT_TIMEZONE);
  const relative = options?.customStatusLabel?.trim() || formatRelativeTimeLabel(date, options);
  return relative ? `${absolute} (${relative})` : absolute;
}
