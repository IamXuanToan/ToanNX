"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Home,
  KeyRound,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PasswordInput } from "@/shares/components/common/password-input";
import { LogoMark } from "@/shares/components/layout/logo-mark";
import { Alert } from "@/shares/components/ui/alert";
import { Button } from "@/shares/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/shares/components/ui/field";

import type { PublicShortLink } from "../../types/short-link.types";
import { DestinationFavicon } from "./destination-favicon";
import { useShortLinkLanding } from "./hooks/use-short-link-landing";

/**
 * Thẻ chuyển hướng liên kết cao cấp chuẩn shadcn UI và semantic tokens của Tailwind CSS (primary, canvas, card, warning, success).
 */
export function ShortLinkLandingCard({
  slug,
  link,
  preview = false,
}: {
  slug: string;
  link?: PublicShortLink;
  preview?: boolean;
}) {
  const t = useTranslations("utilities.shortLinks.landing");
  const tShortLinks = useTranslations("utilities.shortLinks");
  const tUnavailable = useTranslations("utilities.shortLinks.unavailable");
  const state = useShortLinkLanding(slug, link, preview);

  // Giao diện khi đang tải dữ liệu phía client
  if (state.isLoading) {
    return (
      <div className="animate-in fade-in zoom-in-95 relative mx-auto w-full max-w-lg duration-300">
        <div
          aria-hidden="true"
          className="from-primary/20 via-primary/5 absolute -inset-1.5 rounded-[40px] bg-gradient-to-b to-transparent opacity-60 blur-2xl dark:opacity-40"
        />
        <section className="border-border/80 bg-card/95 dark:bg-card/90 relative overflow-hidden rounded-[32px] border p-8 text-center shadow-2xl backdrop-blur-2xl sm:p-12">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="text-primary size-10 animate-spin" />
            <p className="text-muted-foreground text-sm font-medium">{t("title")}</p>
          </div>
        </section>
      </div>
    );
  }

  // Giao diện khi link không khả dụng (hết hạn / quá tải / lỗi)
  if (state.unavailable) {
    const isExpired = state.unavailable === "expired";
    return (
      <div className="animate-in fade-in zoom-in-95 relative mx-auto w-full max-w-lg duration-300">
        {/* Vệt hào quang phát sáng phía sau dùng token warning/destructive */}
        <div
          aria-hidden="true"
          className={`absolute -inset-1.5 rounded-[40px] opacity-40 blur-2xl ${
            isExpired ? "bg-warning/20" : "bg-destructive/20"
          }`}
        />

        <section className="border-border/80 bg-card/95 dark:bg-card/90 relative overflow-hidden rounded-[32px] border p-7 text-center shadow-2xl backdrop-blur-2xl sm:p-9">
          <div
            aria-hidden="true"
            className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent ${
              isExpired ? "via-warning/60" : "via-destructive/60"
            } to-transparent`}
          />

          <div
            className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl ring-8 transition-transform duration-300 hover:scale-105 ${
              isExpired
                ? "bg-warning/10 text-warning ring-warning/5"
                : "bg-destructive/10 text-destructive ring-destructive/5"
            }`}
          >
            {isExpired ? (
              <Clock aria-hidden="true" className="size-7" />
            ) : (
              <RefreshCw aria-hidden="true" className="size-7" />
            )}
          </div>

          <h1 className="text-foreground text-xl font-extrabold tracking-tight text-balance break-words sm:text-2xl">
            {isExpired ? tUnavailable("expired.title") : tUnavailable("busy.title")}
          </h1>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed break-words sm:text-sm">
            {isExpired ? tUnavailable("expired.description") : tUnavailable("busy.description")}
          </p>

          <div className="border-border/60 mt-6 flex justify-center border-t pt-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary gap-1.5 rounded-xl text-xs font-medium"
            >
              <Link href="/">
                <Home aria-hidden="true" className="size-3.5" />
                <span>{t("home")}</span>
              </Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const linkTitle = state.link?.name || t("title");
  const linkDesc = state.link?.description || t("subtitle");

  return (
    <div className="animate-in fade-in zoom-in-95 relative mx-auto w-full max-w-lg duration-300">
      {/* Vệt hào quang phát sáng phía sau mang màu sắc thương hiệu ToanNX */}
      <div
        aria-hidden="true"
        className="from-primary/25 via-primary/5 absolute -inset-1.5 rounded-[40px] bg-gradient-to-b to-transparent opacity-70 blur-2xl transition-opacity duration-500 dark:opacity-50"
      />

      <section className="border-border/80 bg-card/95 dark:bg-card/90 relative overflow-hidden rounded-[32px] border p-5 shadow-2xl backdrop-blur-2xl transition-all sm:p-8">
        {/* Vệt sáng quét ngang đỉnh card bằng màu primary */}
        <div
          aria-hidden="true"
          className="via-primary/70 absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent to-transparent"
        />

        {/* ============================================================ */}
        {/* HEADER: Huy hiệu an toàn + Lộ trình kết nối trực quan */}
        {/* ============================================================ */}
        <div className="flex flex-col items-center text-center">
          {/* Huy hiệu Cổng an toàn */}
          <span className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide shadow-xs">
            <span className="relative flex size-2">
              <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-success relative inline-flex size-2 rounded-full" />
            </span>
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            <span>{t("eyebrow")}</span>
          </span>

          {/* Sơ đồ kết nối đa chiều trực quan (Visual Routing Flow) */}
          <div className="border-border/60 bg-muted/40 dark:bg-muted/20 my-4 flex w-full items-center justify-between gap-2 rounded-2xl border p-2.5 sm:gap-3 sm:p-3">
            {/* Box Bên trái: ToanNX Gateway */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="border-primary/20 bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-xl border shadow-xs sm:size-9">
                <LogoMark className="size-4.5 sm:size-5" />
              </div>
              <div className="text-left">
                <p className="text-foreground text-xs leading-tight font-bold">ToanNX</p>
                <p className="text-muted-foreground text-[10px] font-medium">Safe Gateway</p>
              </div>
            </div>

            {/* Dòng xung động kết nối ở giữa */}
            <div className="flex flex-1 items-center justify-center gap-1 px-1 sm:gap-1.5 sm:px-2">
              <div className="from-primary/20 via-primary/50 to-primary h-0.5 flex-1 bg-gradient-to-r" />
              <div className="border-primary/30 bg-primary/15 text-primary flex size-6 shrink-0 items-center justify-center rounded-full border shadow-xs">
                <ArrowRight aria-hidden="true" className="size-3.5 animate-pulse" />
              </div>
              <div className="from-primary via-primary/50 to-primary/20 h-0.5 flex-1 bg-gradient-to-r" />
            </div>

            {/* Box Bên phải: Đích đến */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="text-right">
                <p className="text-foreground max-w-[80px] truncate font-mono text-xs leading-tight font-bold sm:max-w-[130px]">
                  {state.destinationDomain || "URL"}
                </p>
                <p className="text-muted-foreground text-[10px] font-medium">Verified Link</p>
              </div>
              <div className="border-primary/20 bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-xl border shadow-xs sm:size-9">
                <DestinationFavicon
                  domain={state.destinationDomain}
                  className="size-4.5 sm:size-5"
                  fallbackClassName="size-4.5 sm:size-5"
                  size={20}
                />
              </div>
            </div>
          </div>

          {/* Tiêu đề trang chuyển hướng */}
          <h1 className="text-foreground text-xl font-black tracking-tight text-balance break-words sm:text-2xl">
            {linkTitle}
          </h1>

          {/* Mô tả chuyển hướng hoặc mô tả do người tạo đặt */}
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed break-words sm:text-sm">
            {linkDesc}
          </p>
        </div>

        {/* ============================================================ */}
        {/* INTERACTION AREA: Mở URL đích hoặc Form Mật khẩu */}
        {/* ============================================================ */}
        <div className="mt-4">
          {state.destination ? (
            <>
              {/* Thẻ xem trước đích đến công nghệ cao (Destination Preview Card) */}
              <div className="border-border/80 bg-muted/40 dark:bg-muted/20 my-3 rounded-2xl border p-3.5 shadow-inner transition-colors sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  {/* Domain đích nổi bật kèm favicon */}
                  <span className="border-primary/25 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-bold">
                    <DestinationFavicon
                      domain={state.destinationDomain}
                      className="size-3.5"
                      fallbackClassName="size-3.5"
                      size={14}
                    />
                    <span>{state.destinationDomain || t("destination")}</span>
                  </span>

                  {/* Nút sao chép URL đích */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={state.copyDestination}
                    className="hover:border-primary/30 hover:bg-primary/5 h-7.5 cursor-pointer gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all active:scale-95"
                    title={state.copied ? tShortLinks("copied") : t("copyAction")}
                  >
                    {state.copied ? (
                      <>
                        <Check aria-hidden="true" className="text-success size-3.5" />
                        <span className="text-success font-semibold">{tShortLinks("copied")}</span>
                      </>
                    ) : (
                      <>
                        <Copy aria-hidden="true" className="text-muted-foreground size-3.5" />
                        <span>{t("copyAction")}</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Khối hiển thị URL đích đầy đủ */}
                <div className="border-border/50 bg-background/80 dark:bg-background/40 mt-3 rounded-xl border p-2.5 sm:p-3">
                  <p className="text-foreground/90 font-mono text-xs leading-relaxed font-medium break-all select-all">
                    {state.destination}
                  </p>
                </div>
              </div>

              {/* Chỉ báo đếm ngược công nghệ cao */}
              {state.remaining !== null && !preview ? (
                <div className="my-4 space-y-2">
                  {/* Thanh năng lượng đếm ngược dùng màu primary */}
                  <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary shadow-primary/30 h-full rounded-full shadow-md transition-all duration-1000 ease-linear"
                      style={{ width: `${state.progressPercent}%` }}
                    />
                  </div>

                  {/* Text đếm ngược */}
                  <div className="flex items-center justify-center gap-2 pt-0.5">
                    <div className="bg-primary/15 text-primary flex size-5.5 items-center justify-center rounded-full text-xs font-bold">
                      {state.remaining}
                    </div>
                    <p aria-live="polite" className="text-muted-foreground text-xs font-medium">
                      {t("countdown", { seconds: state.remaining })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="my-3 flex items-center justify-center gap-2">
                  <span className="bg-success/15 text-success flex size-5 items-center justify-center rounded-full">
                    <Check aria-hidden="true" className="size-3" />
                  </span>
                  <p aria-live="polite" className="text-muted-foreground text-xs font-medium">
                    {t("manual")}
                  </p>
                </div>
              )}

              {/* Nút mở URL đích chuẩn shadcn primary button */}
              <Button
                className="group bg-primary text-primary-foreground hover:bg-primary-hover shadow-primary/25 relative mt-2 h-12 w-full gap-2 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-[0.99] sm:h-13 sm:text-base"
                onClick={state.proceed}
              >
                <span>{t("continue")}</span>
                <ExternalLink
                  aria-hidden="true"
                  className="size-4.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Button>
            </>
          ) : (
            /* ============================================================ */
            /* PASSWORD VAULT: Mở khóa bảo mật */
            /* ============================================================ */
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void state.unlock();
              }}
              className="my-3 flex flex-col gap-3 text-left"
            >
              {/* Box Vault bảo mật dùng token warning */}
              <Alert className="border-warning/30 bg-warning/10 dark:bg-warning/15 flex items-center gap-3 rounded-2xl p-3.5 text-xs sm:text-sm">
                <div className="bg-warning/20 text-warning flex size-9 shrink-0 items-center justify-center rounded-xl shadow-xs">
                  <LockKeyhole aria-hidden="true" className="size-4.5" />
                </div>
                <div>
                  <p className="text-foreground font-semibold">{t("protected")}</p>
                  <p className="text-muted-foreground text-xs">{t("passwordHint")}</p>
                </div>
              </Alert>

              <Field data-invalid={Boolean(state.error)}>
                <FieldLabel
                  htmlFor={state.passwordId}
                  className="text-foreground text-xs font-semibold sm:text-sm"
                >
                  {t("passwordLabel")}
                </FieldLabel>
                <PasswordInput
                  id={state.passwordId}
                  value={state.password}
                  onChange={(event) => state.setPassword(event.target.value)}
                  autoComplete="current-password"
                  maxLength={128}
                  disabled={state.isUnlocking}
                  aria-invalid={Boolean(state.error)}
                  required
                />
                {state.error ? (
                  <FieldError className="flex items-center gap-1.5 pt-0.5 text-xs">
                    <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                    <span>{state.error}</span>
                  </FieldError>
                ) : null}
              </Field>

              {/* Nút Mở khóa chuẩn primary */}
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-primary/25 mt-1 h-12 w-full gap-2 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-[0.99] sm:h-13 sm:text-base"
                disabled={state.isUnlocking}
              >
                {state.isUnlocking ? (
                  <>
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                    <span>{t("unlocking")}</span>
                  </>
                ) : (
                  <>
                    <KeyRound aria-hidden="true" className="size-4" />
                    <span>{t("unlock")}</span>
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Thông báo chế độ Xem trước */}
        {preview ? (
          <div className="border-warning/40 bg-warning/10 text-warning mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-1.5 text-center text-xs font-semibold">
            <Sparkles aria-hidden="true" className="size-3.5" />
            <span>{t("previewNotice")}</span>
          </div>
        ) : null}

        {/* Chân card: Nút về trang chủ & Huy hiệu tin cậy */}
        <div className="border-border/60 mt-5 border-t pt-4">
          <div className="flex flex-col items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary gap-1.5 rounded-xl text-xs font-medium transition-colors"
            >
              <Link href="/">
                <Home aria-hidden="true" className="size-3.5" />
                <span>{t("home")}</span>
              </Link>
            </Button>
            <p className="text-muted-foreground/75 text-[11px] font-normal tracking-tight">
              {t("safeShield")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
