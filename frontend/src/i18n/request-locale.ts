import { type AppLocale, DEFAULT_LOCALE, LOCALES } from "./routing";

/** Cookie ngôn ngữ của next-intl. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Ngôn ngữ cho URL không có tiền tố locale (`/s/{slug}`, `/{segment}/{slug}`): cookie ngôn ngữ, rồi
 * `Accept-Language`, mặc định tiếng Việt.
 *
 * @param cookieValue - Giá trị cookie `NEXT_LOCALE`.
 * @param acceptLanguage - Header `Accept-Language`.
 * @returns Ngôn ngữ.
 */
export function resolveRequestLocale(
  cookieValue: string | undefined,
  acceptLanguage: string | null,
): AppLocale {
  if (cookieValue && (LOCALES as readonly string[]).includes(cookieValue))
    return cookieValue as AppLocale;
  const preferred = acceptLanguage?.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  return preferred && (LOCALES as readonly string[]).includes(preferred)
    ? (preferred as AppLocale)
    : DEFAULT_LOCALE;
}
