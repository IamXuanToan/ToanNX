/**
 * Chuẩn số toàn hệ thống (locale vi-VN):
 * - Phân cách hàng nghìn: `.` (vd. 1.000.000)
 * - Phân cách thập phân: `,` (vd. 500,00)
 *
 * Input (`number-input.ts`) và hiển thị read-only/table dùng cùng quy ước.
 */

export const APP_NUMBER_LOCALE = "vi-VN";

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
    currency: options?.currency ?? "VND",
    minimumFractionDigits: options?.minimumFractionDigits,
    maximumFractionDigits: options?.maximumFractionDigits ?? (options?.currency === "USD" ? 2 : 0),
  }).format(number);
}
