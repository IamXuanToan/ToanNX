import { enUS, type Locale, vi } from "date-fns/locale";

import type { AppLocale } from "@/i18n/routing";

const DATE_FNS_LOCALE_MAP: Record<AppLocale, Locale> = { vi, en: enUS };

/** Định dạng ngày hiển thị theo ngôn ngữ (một nơi duy nhất; thêm ngôn ngữ thì thêm ở đây). */
const DATE_DISPLAY_FORMAT_BY_LOCALE: Record<AppLocale, string> = {
  vi: "dd/MM/yyyy",
  en: "MMM d, yyyy",
};

const isAppLocale = (locale: string): locale is AppLocale => locale in DATE_FNS_LOCALE_MAP;

/**
 * Locale `date-fns` theo ngôn ngữ app (không hỗ trợ thì dùng tiếng Anh).
 *
 * @param locale - Mã ngôn ngữ.
 * @returns Locale của date-fns.
 */
export function getDateFnsLocale(locale: string): Locale {
  return DATE_FNS_LOCALE_MAP[isAppLocale(locale) ? locale : "en"];
}

/**
 * Định dạng hiển thị ngày theo ngôn ngữ app.
 *
 * @param locale - Mã ngôn ngữ.
 * @returns Chuỗi định dạng date-fns.
 */
export function getDateDisplayFormat(locale: string): string {
  return DATE_DISPLAY_FORMAT_BY_LOCALE[isAppLocale(locale) ? locale : "en"];
}
