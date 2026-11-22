"use client";

import { Check, Copy, Home, RotateCw, ServerCrash } from "lucide-react";
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
  const { digest, errorMessage, copied, handleCopy } = useAppErrorContent(error);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
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

        {/* Mã Digest sự cố để hỗ trợ người dùng gửi báo cáo lỗi */}
        {digest ? (
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

        {/* Thông tin kỹ thuật khi chạy môi trường development */}
        {errorMessage ? (
          <Card className="bg-destructive/5 border-destructive/20 mt-4 w-full text-left shadow-none">
            <CardContent className="p-3">
              <span className="text-destructive block text-xs font-semibold">
                {t("technicalDetails")} ({t("devOnly")})
              </span>
              <code className="text-muted-foreground mt-1 block font-mono text-xs break-all">
                {errorMessage}
              </code>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
