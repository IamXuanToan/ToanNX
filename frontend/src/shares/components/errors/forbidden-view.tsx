"use client";

import { ArrowLeft, Home, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";

/**
 * Màn hình không có quyền truy cập (403 Forbidden).
 * Không import module theo đúng quy tắc kiến trúc của thư mục `shares/`.
 *
 * @param props - Hành động tùy chỉnh (ví dụ nút đăng xuất/chuyển tài khoản), tiêu đề và mô tả tùy biến.
 * @returns Giao diện 403 chuẩn hoá theo Shadcn UI & Tailwind CSS.
 */
export function ForbiddenView({
  title,
  description,
  action,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  const t = useTranslations("errors.forbidden");
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div
      className="flex min-h-[65svh] flex-col items-center justify-center px-4 py-12 text-center"
      data-testid="forbidden"
    >
      <div className="mx-auto flex max-w-md flex-col items-center">
        <Badge
          variant="outline"
          className="border-destructive/30 bg-destructive/10 text-destructive mb-2 rounded-full px-3 py-1 font-mono text-xs"
        >
          {t("badge")}
        </Badge>

        <p className="text-destructive/15 text-8xl font-black tracking-tighter select-none sm:text-9xl">
          403
        </p>

        <div className="bg-destructive/10 text-destructive ring-destructive/5 -mt-10 mb-4 flex size-16 items-center justify-center rounded-3xl shadow-xs ring-8">
          <ShieldAlert className="size-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title ?? t("title")}</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {description ?? t("description")}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action ? (
            action
          ) : (
            <>
              <Button asChild className="h-10 rounded-xl px-5 font-medium shadow-xs">
                <Link href="/">
                  <Home className="size-4" />
                  {t("backHome")}
                </Link>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="h-10 rounded-xl px-4 font-medium"
              >
                <ArrowLeft className="size-4" />
                {t("backPrevious")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
