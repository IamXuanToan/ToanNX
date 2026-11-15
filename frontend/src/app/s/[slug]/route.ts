import { type NextRequest, NextResponse } from "next/server";

import { getPathname } from "@/i18n/navigation";
import { LOCALE_COOKIE, resolveRequestLocale } from "@/i18n/request-locale";
import { SHORT_LINKS_API_ENDPOINTS } from "@/modules/short-links/constants/api-endpoints";
import { SHORT_LINKS_ROUTES } from "@/modules/short-links/constants/routes";
import { backendFetch } from "@/shares/lib/api/server-api";

const REDIRECT_STATUSES = new Set([301, 302]);

/**
 * `toannx.com/s/{slug}`: hỏi BE rồi chuyển hướng đúng 301/302 (giữ `Cache-Control`, `noindex` của BE).
 * Link tắt/xóa/hết hạn → trang "link không khả dụng" theo ngôn ngữ người xem.
 *
 * @param request - Request.
 * @param context - Tham số route (`slug`).
 * @returns Redirect.
 */
export async function GET(request: NextRequest, context: RouteContext<"/s/[slug]">) {
  const { slug } = await context.params;
  const response = await backendFetch(SHORT_LINKS_API_ENDPOINTS.resolve(slug), request.headers, {
    redirect: "manual",
  });
  const location = response.headers.get("location");
  if (REDIRECT_STATUSES.has(response.status) && location) {
    return new NextResponse(null, {
      status: response.status,
      headers: {
        Location: location,
        "Cache-Control": response.headers.get("cache-control") ?? "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  }
  const locale = resolveRequestLocale(
    request.cookies.get(LOCALE_COOKIE)?.value,
    request.headers.get("accept-language"),
  );
  const reason =
    response.status === 410 ? "expired" : response.status === 429 ? "busy" : "not-found";
  const target = getPathname({
    href: { pathname: SHORT_LINKS_ROUTES.unavailable, query: { reason } },
    locale,
  });
  return NextResponse.redirect(new URL(target, request.url), {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
