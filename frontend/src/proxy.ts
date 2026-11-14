import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { getPathname } from "./i18n/navigation";
import { type AppLocale, routing } from "./i18n/routing";
import { APP_ROUTES } from "./shares/constants/routes";

/** Cookie "gợi ý có phiên" do backend đặt (HttpOnly, không chứa token). */
const SESSION_HINT_COOKIE = "toannx_session";

const intlProxy = createMiddleware(routing);

function localizedPath(
  href: typeof APP_ROUTES.admin | typeof APP_ROUTES.login,
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
    const adminPath = localizedPath(APP_ROUTES.admin, locale);
    const loginPath = localizedPath(APP_ROUTES.login, locale);
    const isAdmin = pathname === adminPath || pathname.startsWith(`${adminPath}/`);

    if (isAdmin && !hasSession) {
      const url = new URL(loginPath, request.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    if (pathname === loginPath && hasSession) {
      return NextResponse.redirect(new URL(adminPath, request.url));
    }
  }
  return intlProxy(request);
}

export const config = {
  // Bỏ qua API (rewrite sang Django), file nội bộ Next và file tĩnh.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
