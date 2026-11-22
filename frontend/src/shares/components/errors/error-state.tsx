"use client";

import { AlertCircle, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "cn";

import { Button } from "@/shares/components/ui/button";
import { Card, CardContent } from "@/shares/components/ui/card";

/**
 * Khối báo lỗi trong trang (Dùng Card và Button chuẩn Shadcn UI).
 *
 * @param props - Tiêu đề, thông báo chi tiết, hàm thử lại và className tùy biến.
 * @returns Khối hiển thị trạng thái lỗi.
 */
export function ErrorState({
  title,
  message,
  onRetry,
  className,
}: {
  title?: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  const t = useTranslations("errors.generic");
  return (
    <Card
      role="alert"
      aria-live="polite"
      className={cn(
        "border-destructive/30 bg-destructive/5 rounded-2xl text-center shadow-2xs",
        className,
      )}
    >
      <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8">
        <div className="bg-destructive/10 text-destructive ring-destructive/5 mb-3.5 flex size-12 items-center justify-center rounded-2xl ring-4">
          <AlertCircle className="size-6" />
        </div>
        <p className="text-foreground text-sm font-semibold tracking-tight sm:text-base">
          {title ?? t("title")}
        </p>
        <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed sm:text-sm">
          {message ?? t("description")}
        </p>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 rounded-xl shadow-2xs"
            onClick={onRetry}
          >
            <RotateCw className="size-3.5" />
            {t("retry")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
