"use client";

import { cn } from "cn";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentProps, ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";

import { AppTooltip } from "./app-tooltip";

/** Đích của nút quay lại (route có kiểu của next-intl). */
export type PageBackHref = ComponentProps<typeof Link>["href"];

/**
 * Tiêu đề trang quản trị / portal kèm mô tả và cụm hành động bên phải.
 * Trang tạo/chi tiết/sửa dùng `FormPage` + `FormActions` để đặt `[Quay lại]` đứng trái nút chính;
 * prop `backHref` giữ lại cho các trường hợp đặc thù cần icon `←` cạnh tiêu đề.
 *
 * @param props - Tiêu đề, đích quay lại, mô tả, hành động.
 * @returns Header trang.
 */
export function PageHeader({
  title,
  backHref,
  description,
  actions,
  inline = false,
}: {
  title: ReactNode;
  backHref?: PageBackHref;
  /** Luôn một hàng (tiêu đề cắt ngắn, nút bên phải) kể cả màn hẹp — đầu trang dính của `FormPage`. */
  inline?: boolean;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  const t = useTranslations("common.actions");
  return (
    <header
      className={cn(
        inline
          ? "flex flex-wrap items-center justify-between gap-2 sm:flex-nowrap sm:gap-3"
          : "flex flex-col gap-4 sm:flex-row sm:justify-between",
        // Không có mô tả: tên trang thẳng giữa với nút; có mô tả: nút bám mép trên.
        description ? "sm:items-start" : "sm:items-center",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {backHref ? (
          <AppTooltip content={t("back")} side="bottom">
            <Button asChild variant="outline" size="icon" className="shrink-0">
              <Link href={backHref} aria-label={t("back")} data-testid="page-back">
                <ArrowLeft />
              </Link>
            </Button>
          </AppTooltip>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">{title}</h1>
          {description ? (
            <p className="text-muted-foreground mt-1 max-w-[55ch] text-sm text-pretty">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex max-w-full shrink-0 flex-wrap justify-end gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
