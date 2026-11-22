"use client";

import { Clock, ExternalLink, Link2Off, RefreshCw, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";

const REASONS = ["not-found", "expired", "busy"] as const;

/**
 * Thông báo khi link rút gọn không chuyển hướng được (đã tắt/xóa, hết hạn, quá nhiều lượt).
 * Sử dụng 100% semantic tokens của theme (primary, card, warning, destructive), chuẩn shadcn UI.
 *
 * @param props - Lý do (`?reason=`) và lối ra (page ghép, ví dụ về trang chủ).
 * @returns Trang thông báo.
 */
export function LinkUnavailableView({ reason, action }: { reason?: string; action?: ReactNode }) {
  const t = useTranslations("utilities.shortLinks.unavailable");
  const key = REASONS.find((item) => item === reason) ?? "not-found";

  const isExpired = key === "expired";
  const isBusy = key === "busy";

  return (
    <div className="animate-in fade-in zoom-in-95 relative mx-auto w-full max-w-md duration-300">
      {/* Vệt hào quang phát sáng phía sau dùng token semantic */}
      <div
        aria-hidden="true"
        className={`absolute -inset-1 rounded-[36px] opacity-40 blur-xl ${
          isExpired || isBusy ? "bg-warning/20" : "bg-destructive/20"
        }`}
      />

      <section className="border-border bg-card/95 dark:bg-card/85 relative overflow-hidden rounded-[28px] border p-5 text-center shadow-2xl backdrop-blur-xl sm:p-7">
        {/* Vệt màu highlight đỉnh card */}
        <div
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent ${
            isExpired || isBusy ? "via-warning/60" : "via-destructive/60"
          } to-transparent`}
        />

        {/* Huy hiệu cảnh báo */}
        <div className="border-border bg-muted/50 text-muted-foreground mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold">
          <ShieldAlert aria-hidden="true" className="text-destructive size-3.5" />
          <span>{t("notice")}</span>
        </div>

        {/* Icon chỉ báo trạng thái */}
        <div
          className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl ring-6 transition-transform duration-300 hover:scale-105 ${
            isExpired || isBusy
              ? "bg-warning/10 text-warning ring-warning/5"
              : "bg-destructive/10 text-destructive ring-destructive/5"
          }`}
        >
          {isExpired ? (
            <Clock aria-hidden="true" className="size-7" />
          ) : isBusy ? (
            <RefreshCw aria-hidden="true" className="size-7" />
          ) : (
            <Link2Off aria-hidden="true" className="size-7" />
          )}
        </div>

        {/* Tiêu đề & mô tả */}
        <h1 className="text-foreground text-lg font-extrabold tracking-tight text-balance break-words sm:text-xl">
          {t(`${key}.title`)}
        </h1>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed break-words sm:text-sm">
          {t(`${key}.description`)}
        </p>

        {/* Nút hành động chuẩn shadcn primary button */}
        <div className="mt-5 flex flex-col gap-2">
          {action ? (
            action
          ) : (
            <Button
              asChild
              className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 h-11 w-full gap-2 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] sm:h-12 sm:text-base"
            >
              <Link href="/">
                <span>{t("home")}</span>
                <ExternalLink aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
