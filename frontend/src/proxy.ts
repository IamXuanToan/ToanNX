import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { getPathname } from "./i18n/navigation";
import { LOCALE_COOKIE, resolveRequestLocale } from "./i18n/request-locale";
import { type AppLocale, routing } from "./i18n/routing";
import { AUTH_ROUTES } from "./modules/auth/constants/routes";
import {
  PUBLIC_PAGE_ROUTE_PREFIX,
  RESERVED_SEGMENTS,
} from "./modules/custom-pages/constants/routes";
import { MANAGE_APP_ROUTES } from "./modules/manage-app/constants/routes";
import { NOVEL_ROUTES } from "./modules/novel/constants/routes";

/** Cookie "gợi ý có phiên" do backend đặt (HttpOnly, không chứa token; khớp `AUTH_SESSION_HINT_COOKIE_NAME`). */
const SESSION_HINT_COOKIE = "session_hint";

const intlProxy = createMiddleware(routing);

function localizedPath(
  href: typeof MANAGE_APP_ROUTES.admin | typeof AUTH_ROUTES.login,
  locale: AppLocale,
): string {
  return getPathname({ href, locale });
}

/**
 * Proxy: định tuyến đa ngôn ngữ + kiểm tra LẠC QUAN cho khu vực quản trị.
 * Chỉ dựa vào sự tồn tại của cookie gợi ý phiên; quyền thực sự do backend quyết định.
 *
 * @param request - Request đến.
 * @returns Response chuyển hướng hoặc response của next-intl.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const locale = routing.locales.find(
    (item) => pathname === `/${item}` || pathname.startsWith(`/${item}/`),
  );
  if (locale) {
    const hasSession = request.cookies.has(SESSION_HINT_COOKIE);
    const adminPath = localizedPath(MANAGE_APP_ROUTES.admin, locale);
    const loginPath = localizedPath(AUTH_ROUTES.login, locale);
    const novelPath = getPathname({ href: NOVEL_ROUTES.catalog, locale });
    const isAdmin = pathname === adminPath || pathname.startsWith(`${adminPath}/`);
    const isNovel = pathname === novelPath || pathname.startsWith(`${novelPath}/`);

    if (isNovel && !hasSession) {
      const url = new URL(loginPath, request.url);
      url.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(url);
    }

    if (isAdmin && !hasSession) {
      const url = new URL(loginPath, request.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    if (pathname === loginPath && hasSession) {
      return NextResponse.redirect(new URL(adminPath, request.url));
    }
  }
  const publicPage = matchPublicPage(pathname);
  if (!locale && publicPage) {
    // Trang công khai `/<segment>/<slug>` không có tiền tố locale: chọn ngôn ngữ theo cookie/trình duyệt.
    const pageLocale = resolveRequestLocale(
      request.cookies.get(LOCALE_COOKIE)?.value,
      request.headers.get("accept-language"),
    );
    const url = request.nextUrl.clone();
    url.pathname = `/${pageLocale}/${PUBLIC_PAGE_ROUTE_PREFIX}/${publicPage.segment}/${publicPage.slug}`;
    return NextResponse.rewrite(url);
  }
  return intlProxy(request);
}

/**
 * URL đúng hai đoạn mà đoạn đầu không phải locale/đoạn dành riêng → trang công khai của Custom Pages.
 *
 * @param pathname - Pathname gốc.
 * @returns Segment và slug, hoặc null.
 */
function matchPublicPage(pathname: string): { segment: string; slug: string } | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const [segment, slug] = parts.map((part) => decodeURIComponent(part).toLowerCase());
  if (RESERVED_SEGMENTS.has(segment) || (routing.locales as readonly string[]).includes(segment))
    return null;
  return /^[a-z0-9-]{1,64}$/.test(segment) && /^[a-z0-9-]{1,64}$/.test(slug)
    ? { segment, slug }
    : null;
}

export const config = {
  // Bỏ qua API (rewrite sang Django), file nội bộ Next, file tĩnh và link rút gọn `/s/{slug}` (route handler).
  matcher: ["/((?!api|_next|_vercel|s/|.*\\..*).*)"],
};
