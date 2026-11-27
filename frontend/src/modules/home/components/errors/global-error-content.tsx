"use client";

import { AlertTriangle, RotateCw, ServerCrash } from "lucide-react";

import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent } from "@/shares/components/ui/card";

import { useGlobalErrorContent } from "./hooks/use-global-error-content";

const GLOBAL_MESSAGES = {
  vi: {
    documentTitle: "Lỗi hệ thống · ToanNX",
    badge: "500 · LỖI HỆ THỐNG",
    title: "Đã xảy ra lỗi hệ thống",
    subtitle: "Đã có sự cố xảy ra từ phía chúng tôi.",
    description:
      "Sự cố nghiêm trọng đã xảy ra ở tầng giao diện gốc. Vui lòng thử lại hoặc tải lại trang.",
    retry: "Thử lại",
    reload: "Tải lại trang",
    digest: "Mã sự cố (Digest):",
    technicalDetails: "Chi tiết kỹ thuật (Chỉ môi trường phát triển)",
    stackTrace: "Stack Trace:",
  },
  en: {
    documentTitle: "System Error · ToanNX",
    badge: "500 · SYSTEM ERROR",
    title: "System Error Occurred",
    subtitle: "Something went wrong on our end.",
    description: "A critical error occurred in the root layout. Please retry or reload the page.",
    retry: "Try again",
    reload: "Reload page",
    digest: "Issue code (Digest):",
    technicalDetails: "Technical Details (Development Environment Only)",
    stackTrace: "Stack Trace:",
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
export function GlobalErrorContent({ error, retry }: { error: unknown; retry: () => void }) {
  const { locale, digest, errorName, errorMessage, errorStack, isDev } =
    useGlobalErrorContent(error);
  const t = GLOBAL_MESSAGES[locale];

  return (
    <html lang={locale}>
      <title>{t.documentTitle}</title>
      <body className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center p-4 text-center antialiased">
        <div className="mx-auto flex max-w-xl flex-col items-center">
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

          {/* Chỉ hiển thị khối chi tiết lỗi kỹ thuật ở môi trường phát triển */}
          {isDev ? (
            <Card className="border-destructive/60 bg-destructive/10 text-destructive mt-8 w-full text-left shadow-md">
              <CardContent className="p-4 sm:p-5">
                <div className="border-destructive/20 flex items-center gap-2 border-b pb-3">
                  <AlertTriangle className="text-destructive size-4 shrink-0 animate-pulse" />
                  <span className="text-destructive text-xs font-bold tracking-wider uppercase">
                    {t.technicalDetails}
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  <div className="bg-destructive/15 border-destructive/30 text-destructive rounded-xl border p-3 font-mono text-xs leading-relaxed font-bold break-all select-all">
                    {errorName}: {errorMessage}
                  </div>

                  {digest ? (
                    <div className="text-muted-foreground text-xs">
                      <span className="text-foreground font-semibold">{t.digest}:</span>{" "}
                      <code className="bg-muted/60 rounded px-1.5 py-0.5 font-mono select-all">
                        {digest}
                      </code>
                    </div>
                  ) : null}

                  {errorStack ? (
                    <div className="mt-2.5">
                      <span className="text-muted-foreground mb-1.5 block text-xs font-semibold">
                        {t.stackTrace}
                      </span>
                      <pre className="max-h-64 overflow-x-auto rounded-xl bg-zinc-950 p-3.5 font-mono text-[11px] leading-relaxed text-red-300 select-all dark:bg-black dark:text-red-400">
                        {errorStack}
                      </pre>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : digest ? (
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
