/**
 * Chuẩn số toàn hệ thống (locale vi-VN):
 * - Phân cách hàng nghìn: `.` (vd. 1.000.000)
 * - Phân cách thập phân: `,` (vd. 500,00)
 *
 * Input (`number-input.ts`) và hiển thị read-only/table dùng cùng quy ước.
 */

import { CURRENCY_CODES, CURRENCY_SYMBOLS } from "@/shares/constants/currency";
import {
  APP_NUMBER_LOCALE,
  ENGLISH_LOCALE_CODE,
  NUMBER_LOCALE_BY_LOCALE,
} from "@/shares/constants/locale";

export { APP_NUMBER_LOCALE };

/**
 * Trả về locale chuẩn `Intl` (`vi-VN` hoặc `en-US`) tương ứng với mã ngôn ngữ giao diện.
 *
 * @param locale - Mã ngôn ngữ app hiện tại (`vi` hoặc `en`).
 * @returns Locale định dạng số (`vi-VN` / `en-US`).
 */
export function getNumberLocale(locale: string): string {
  return locale === ENGLISH_LOCALE_CODE ? NUMBER_LOCALE_BY_LOCALE.en : NUMBER_LOCALE_BY_LOCALE.vi;
}

export type NumberSeparators = {
  group: string;
  decimal: string;
};

let cachedViSeparators: NumberSeparators | null = null;

/**
 * Ký tự phân cách nghìn và thập phân của locale (vi-VN: `.` và `,`).
 *
 * @param locale - Locale.
 * @returns Ký tự phân cách.
 */
export function getNumberSeparators(locale = APP_NUMBER_LOCALE): NumberSeparators {
  if (locale === APP_NUMBER_LOCALE && cachedViSeparators) {
    return cachedViSeparators;
  }

  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.89);
  const separators = {
    group: parts.find((part) => part.type === "group")?.value ?? ".",
    decimal: parts.find((part) => part.type === "decimal")?.value ?? ",",
  };

  if (locale === APP_NUMBER_LOCALE) {
    cachedViSeparators = separators;
  }

  return separators;
}

export type FormatDisplayNumberOptions = {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

/**
 * Định dạng số để hiển thị chỉ đọc (bảng, chi tiết) theo vi-VN.
 *
 * @param value - Giá trị.
 * @param options - Locale, số chữ số thập phân.
 * @returns Chuỗi hiển thị.
 */
export function formatDisplayNumber(value: unknown, options?: FormatDisplayNumberOptions): string {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return String(value ?? "");

  const locale = options?.locale ?? APP_NUMBER_LOCALE;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: options?.minimumFractionDigits,
    maximumFractionDigits: options?.maximumFractionDigits,
  }).format(number);
}

export type FormatDisplayMoneyOptions = {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

/**
 * Định dạng tiền để hiển thị chỉ đọc (mặc định VND, không phần lẻ).
 *
 * @param value - Giá trị.
 * @param options - Locale, đơn vị, số chữ số thập phân.
 * @returns Chuỗi hiển thị.
 */
export function formatDisplayMoney(value: unknown, options?: FormatDisplayMoneyOptions): string {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return String(value ?? "");

  const locale = options?.locale ?? APP_NUMBER_LOCALE;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: options?.currency ?? CURRENCY_CODES.VND,
    minimumFractionDigits: options?.minimumFractionDigits,
    maximumFractionDigits:
      options?.maximumFractionDigits ?? (options?.currency === CURRENCY_CODES.USD ? 2 : 0),
  }).format(number);
}

/**
 * Định dạng tiền VNĐ kèm khoảng trắng chuẩn + ký hiệu `₫` (dùng cho thẻ/preset/tooltip giữ định dạng `50.000 ₫`).
 *
 * @param value - Giá trị số.
 * @param locale - Locale định dạng số (mặc định `vi-VN`).
 * @returns Chuỗi tiền tệ `50.000 ₫`.
 */
export function formatVndText(value: unknown, locale = APP_NUMBER_LOCALE): string {
  return `${formatDisplayNumber(value, { locale })} ${CURRENCY_SYMBOLS.VND}`;
}

/**
 * Định dạng số rút gọn cho nhãn trục biểu đồ (ví dụ `120 Tr`, `1,2 Tỷ`), giữ tooltip nguyên số.
 *
 * @param value - Giá trị số.
 * @param locale - Locale hiện tại (mặc định `vi-VN`).
 * @returns Chuỗi ngắn gọn.
 */
export function formatCompactDisplayNumber(value: unknown, locale = APP_NUMBER_LOCALE): string {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return String(value ?? "");

  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
}
