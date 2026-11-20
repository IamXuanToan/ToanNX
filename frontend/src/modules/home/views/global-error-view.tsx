"use client";

import { RotateCw, ServerCrash } from "lucide-react";

import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent } from "@/shares/components/ui/card";

import { useReportClientError } from "../hooks/use-report-client-error";

const GLOBAL_MESSAGES = {
  vi: {
    documentTitle: "Lỗi hệ thống · TOANNX",
    badge: "500 · LỖI HỆ THỐNG",
    title: "Đã xảy ra lỗi hệ thống",
    subtitle: "Something went wrong on our end.",
    description:
      "Sự cố nghiêm trọng đã xảy ra ở tầng giao diện gốc. Vui lòng thử lại hoặc tải lại trang.",
    retry: "Thử lại",
    reload: "Tải lại trang",
    digest: "Mã sự cố (Digest):",
  },
  en: {
    documentTitle: "System Error · TOANNX",
    badge: "500 · SYSTEM ERROR",
    title: "System Error Occurred",
    subtitle: "Something went wrong on our end.",
    description: "A critical error occurred in the root layout. Please retry or reload the page.",
    retry: "Try again",
    reload: "Reload page",
    digest: "Issue code (Digest):",
  },
} as const;

/**
 * Màn lỗi khi chính layout gốc hỏng: tự dựng `<html>`/`<body>`,
 * không có provider đa ngôn ngữ của next-intl nên tự động nhận diện ngôn ngữ từ URL,
 * giao diện tương thích dark/light mode và dùng trọn bộ Shadcn UI primitives.
 *
 * @param props - Lỗi và hàm thử lại do Next.js cung cấp.
 * @returns Tài liệu HTML hoàn chỉnh của trang lỗi toàn cục.
 */
export function GlobalErrorView({ error, retry }: { error: unknown; retry: () => void }) {
  useReportClientError(error);

  const isEn = typeof window !== "undefined" && window.location.pathname.startsWith("/en");
  const locale: "vi" | "en" = isEn ? "en" : "vi";
  const t = GLOBAL_MESSAGES[locale];

  const digest =
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string"
      ? (error as { digest: string }).digest
      : null;

  return (
    <html lang={locale}>
      <title>{t.documentTitle}</title>
      <body className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center p-4 text-center antialiased">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <Badge
            variant="outline"
            className="border-destructive/30 bg-destructive/10 text-destructive mb-2 rounded-full px-3 py-1 font-mono text-xs"
          >
            {t.badge}
          </Badge>

          <p className="text-destructive/15 text-8xl font-black tracking-tighter select-none sm:text-9xl">
            500
          </p>

          <div className="bg-destructive/10 text-destructive ring-destructive/5 -mt-10 mb-4 flex size-16 items-center justify-center rounded-3xl shadow-xs ring-8">
            <ServerCrash className="size-8" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">{t.subtitle}</p>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{t.description}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              onClick={() => retry()}
              className="h-10 rounded-xl px-5 font-medium shadow-xs"
            >
              <RotateCw className="size-4" />
              {t.retry}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
              className="h-10 rounded-xl px-4 font-medium"
            >
              {t.reload}
            </Button>
          </div>

          {digest ? (
            <Card className="bg-muted/40 border-border/60 mt-8 w-full text-left shadow-none">
              <CardContent className="p-3">
                <span className="text-muted-foreground block text-xs font-medium">{t.digest}</span>
                <code className="text-foreground mt-1 block font-mono text-xs break-all select-all">
                  {digest}
                </code>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </body>
    </html>
  );
}
