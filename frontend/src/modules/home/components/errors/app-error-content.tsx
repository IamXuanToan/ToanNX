"use client";

import { AlertTriangle, Check, Copy, Home, RotateCw, ServerCrash } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent } from "@/shares/components/ui/card";

import { HOME_ROUTES } from "../../constants/routes";
import { useAppErrorContent } from "./hooks/use-app-error-content";

/**
 * Nội dung màn lỗi máy chủ / lỗi thời gian chạy (500): báo lỗi, mã digest, thử lại.
 *
 * @param props - Lỗi và hàm thử lại do Next.js error boundary cung cấp.
 * @returns Giao diện lỗi máy chủ chuẩn hoá, an toàn cho người dùng, hỗ trợ xem mã digest.
 */
export function AppErrorContent({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("errors.serverError");
  const { digest, errorName, errorMessage, errorStack, isDev, copied, handleCopy } =
    useAppErrorContent(error);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <Badge
          variant="outline"
          className="border-destructive/30 bg-destructive/10 text-destructive mb-2 rounded-full px-3 py-1 font-mono text-xs"
        >
          {t("badge")}
        </Badge>

        <p className="text-destructive/15 text-8xl font-black tracking-tighter select-none sm:text-9xl">
          500
        </p>

        <div className="bg-destructive/10 text-destructive ring-destructive/5 -mt-10 mb-4 flex size-16 items-center justify-center rounded-3xl shadow-xs ring-8">
          <ServerCrash className="size-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t("description")}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            onClick={() => retry()}
            className="h-10 rounded-xl px-5 font-medium shadow-xs"
          >
            <RotateCw className="size-4" />
            {t("retry")}
          </Button>

          <Button asChild variant="outline" className="h-10 rounded-xl px-4 font-medium">
            <Link href={HOME_ROUTES.home}>
              <Home className="size-4" />
              {t("backHome")}
            </Link>
          </Button>
        </div>

        {/* Khối cảnh báo lỗi nổi bật dành cho dev hoặc khi có chi tiết lỗi */}
        {isDev || errorMessage ? (
          <Card className="border-destructive/60 bg-destructive/10 text-destructive mt-8 w-full text-left shadow-md">
            <CardContent className="p-4 sm:p-5">
              <div className="border-destructive/20 flex items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-destructive size-4 shrink-0 animate-pulse" />
                  <span className="text-destructive text-xs font-bold tracking-wider uppercase">
                    {t("technicalDetails")} ({t("devOnly")})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleCopy}
                  className="border-destructive/30 bg-background/80 hover:bg-destructive/20 hover:text-destructive h-7 gap-1.5 text-xs font-medium"
                  title={t("copyDetailsTitle")}
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copied ? t("copiedDetails") : t("copyDetails")}</span>
                </Button>
              </div>

              <div className="mt-3 space-y-2.5">
                <div className="bg-destructive/15 border-destructive/30 text-destructive rounded-xl border p-3 font-mono text-xs leading-relaxed font-bold break-all select-all">
                  {errorName}: {errorMessage}
                </div>

                {digest ? (
                  <div className="text-muted-foreground text-xs">
                    <span className="text-foreground font-semibold">Digest:</span>{" "}
                    <code className="bg-muted/60 rounded px-1.5 py-0.5 font-mono select-all">
                      {digest}
                    </code>
                  </div>
                ) : null}

                {errorStack ? (
                  <div className="mt-2.5">
                    <span className="text-muted-foreground mb-1.5 block text-xs font-semibold">
                      Stack Trace:
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
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">{t("errorDigest")}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="text-muted-foreground hover:text-foreground h-6 gap-1 px-1.5 text-[11px]"
                  title={t("copyDigest")}
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copied ? t("copiedDigest") : t("copyDigest")}</span>
                </Button>
              </div>
              <code className="text-foreground mt-1.5 block font-mono text-xs break-all select-all">
                {digest}
              </code>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
