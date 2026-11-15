import { format, isValid, parse } from "date-fns";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Lấy phần ngày `yyyy-MM-dd` từ giá trị ngày/ngày giờ.
 *
 * @param value - Giá trị.
 * @returns Chuỗi ngày hoặc rỗng.
 */
export function toInputDate(value: unknown): string {
  if (!value) return "";
  return String(value).slice(0, 10);
}

/**
 * Lấy phần `yyyy-MM-ddTHH:mm` từ giá trị ngày giờ.
 *
 * @param value - Giá trị.
 * @returns Chuỗi ngày giờ hoặc rỗng.
 */
export function toInputDateTime(value: unknown): string {
  if (!value) return "";
  return String(value).slice(0, 16);
}

/**
 * Parse ngày ISO `yyyy-MM-dd` (giờ địa phương).
 *
 * @param value - Chuỗi ngày.
 * @returns Ngày, hoặc `undefined` khi không hợp lệ.
 */
export function parseIsoDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const datePart = value.slice(0, 10);
  if (!ISO_DATE_PATTERN.test(datePart)) return undefined;
  const parsed = parse(datePart, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

/**
 * Định dạng ngày thành `yyyy-MM-dd`.
 *
 * @param date - Ngày.
 * @returns Chuỗi ngày hoặc rỗng.
 */
export function formatIsoDate(date?: Date): string {
  if (!date || !isValid(date)) return "";
  return format(date, "yyyy-MM-dd");
}

/**
 * Parse giờ `HH:mm` (hoặc `HH:mm:ss`).
 *
 * @param value - Chuỗi giờ.
 * @returns Giờ và phút, hoặc `undefined` khi không hợp lệ.
 */
export function parseTimeString(
  value?: string | null,
): { hour: number; minute: number } | undefined {
  if (!value) return undefined;
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) return undefined;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return undefined;
  return { hour, minute };
}

/**
 * Định dạng giờ thành `HH:mm`.
 *
 * @param hour - Giờ.
 * @param minute - Phút.
 * @returns Chuỗi giờ.
 */
export function formatTimeString(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Parse ngày giờ địa phương `yyyy-MM-ddTHH:mm`.
 *
 * @param value - Chuỗi ngày giờ.
 * @returns Ngày giờ, hoặc `undefined` khi không hợp lệ.
 */
export function parseDateTimeLocal(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const normalized = value.length === 16 ? value : value.slice(0, 16);
  const parsed = parse(normalized, "yyyy-MM-dd'T'HH:mm", new Date());
  return isValid(parsed) ? parsed : undefined;
}

/**
 * Định dạng ngày giờ thành `yyyy-MM-ddTHH:mm`.
 *
 * @param date - Ngày giờ.
 * @returns Chuỗi ngày giờ hoặc rỗng.
 */
export function formatDateTimeLocal(date?: Date): string {
  if (!date || !isValid(date)) return "";
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Ghép ngày với giờ/phút (giây = 0).
 *
 * @param date - Ngày.
 * @param hour - Giờ.
 * @param minute - Phút.
 * @returns Ngày giờ mới.
 */
export function mergeDateAndTime(date: Date, hour: number, minute: number): Date {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour);
export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) => minute);

/**
 * Làm tròn phút theo bước (5, 15…), kẹp trong 0–59.
 *
 * @param minute - Phút.
 * @param step - Bước phút.
 * @returns Phút đã làm tròn.
 */
export function snapMinuteToStep(minute: number, step = 1): number {
  if (step <= 1) return minute;
  const snapped = Math.round(minute / step) * step;
  return Math.min(59, Math.max(0, snapped));
}
