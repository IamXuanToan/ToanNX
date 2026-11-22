import Link from "next/link";
import { cookies, headers } from "next/headers";
import { FileQuestion, Home } from "lucide-react";
import "./globals.css";

import { LOCALE_COOKIE, resolveRequestLocale } from "@/i18n/request-locale";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";

const NOT_FOUND_MESSAGES = {
  vi: {
    documentTitle: "Không tìm thấy trang · ToanNX",
    badge: "404 · KHÔNG TÌM THẤY",
    title: "Không tìm thấy trang",
    description: "Đường dẫn không tồn tại hoặc đã bị xóa.",
    backHome: "Về trang chủ",
  },
  en: {
    documentTitle: "Page not found · ToanNX",
    badge: "404 · NOT FOUND",
    title: "Page not found",
    description: "The requested URL was not found on this server.",
    backHome: "Back to home",
  },
} as const;

/**
 * Trang 404 cấp gốc (khi URL không có locale hợp lệ):
 * Tự động nhận diện ngôn ngữ theo cookie/Accept-Language để hiển thị đơn ngôn ngữ chuẩn xác.
 *
 * @returns Giao diện 404 chuẩn hóa theo Shadcn UI có liên kết về trang chủ tương ứng.
 */
export default async function RootNotFound() {
  const cookieStore = await cookies();
  const headerList = await headers();
  const locale = resolveRequestLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerList.get("accept-language"),
  );
  const t = NOT_FOUND_MESSAGES[locale];

  return (
    <html lang={locale}>
      <title>{t.documentTitle}</title>
      <body className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center p-4 text-center antialiased">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <Badge variant="outline" className="mb-2 rounded-full px-3 py-1 font-mono text-xs">
            {t.badge}
          </Badge>

          <p className="text-muted-foreground/20 text-8xl font-black tracking-tighter select-none sm:text-9xl">
            404
          </p>

          <div className="bg-muted/70 border-border/60 -mt-10 mb-4 flex size-16 items-center justify-center rounded-3xl border shadow-xs backdrop-blur-xs">
            <FileQuestion className="text-muted-foreground size-8" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
          <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
            {t.description}
          </p>

          <Button asChild className="mt-6 h-10 rounded-xl px-5 font-medium shadow-xs">
            <Link href={`/${locale}`}>
              <Home className="size-4" />
              {t.backHome}
            </Link>
          </Button>
        </div>
      </body>
    </html>
  );
}
