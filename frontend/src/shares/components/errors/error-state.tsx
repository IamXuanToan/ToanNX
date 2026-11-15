"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button } from "@/shares/components/ui/button";

/**
 * Khối báo lỗi cục bộ (tham khảo ErrorStateCard của Medoly, dùng token `destructive`).
 *
 * @param props - Tiêu đề, thông báo và hàm thử lại.
 * @returns Khối lỗi.
 */
export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title?: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
}) {
  const t = useTranslations("errors.generic");
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/5 rounded-xl border p-6 text-center"
    >
      <div className="bg-destructive/10 text-destructive mx-auto flex size-10 items-center justify-center rounded-lg">
        <AlertCircle className="size-5" />
      </div>
      <p className="mt-3 text-sm font-semibold">{title ?? t("title")}</p>
      <p className="text-muted-foreground mt-1 text-sm">{message ?? t("description")}</p>
      {onRetry ? (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RefreshCw />
          {t("retry")}
        </Button>
      ) : null}
    </div>
  );
}
