/** Bảng ánh xạ pathname nội bộ sang đường dẫn theo ngôn ngữ (khớp `<M>_PATHNAMES`). */
export type LocalizedPathnameMap = Record<string, { vi: string; en: string }>;

/**
 * Kiểm tra đường dẫn hiện tại có khớp chính xác route (bản nội bộ, `/vi/...` hoặc `/en/...`) không.
 *
 * @param pathname - Đường dẫn từ `usePathname()` của `@/i18n/navigation`.
 * @param route - Khóa route gốc (ví dụ `PORTAL_ROUTES.dashboard`).
 * @param pathnames - Bảng pathname của module (ví dụ `PORTAL_PATHNAMES`).
 * @returns `true` nếu khớp chính xác.
 */
export function isLocalizedRouteExact(
  pathname: string,
  route: string,
  pathnames: LocalizedPathnameMap,
): boolean {
  const entry = pathnames[route];
  if (!entry) return pathname === route;
  return pathname === route || pathname === entry.vi || pathname === entry.en;
}

/**
 * Kiểm tra đường dẫn hiện tại có thuộc phân nhánh route (bắt đầu bằng route nội bộ hoặc bản dịch vi/en) không.
 *
 * @param pathname - Đường dẫn từ `usePathname()`.
 * @param route - Khóa route gốc.
 * @param pathnames - Bảng pathname của module.
 * @returns `true` nếu `pathname` thuộc nhánh của `route`.
 */
export function startsWithLocalizedRoute(
  pathname: string,
  route: string,
  pathnames: LocalizedPathnameMap,
): boolean {
  const entry = pathnames[route];
  if (!entry) return pathname.startsWith(route);
  return (
    pathname.startsWith(route) || pathname.startsWith(entry.vi) || pathname.startsWith(entry.en)
  );
}
