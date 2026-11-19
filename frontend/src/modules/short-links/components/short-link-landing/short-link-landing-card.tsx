"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Home,
  KeyRound,
  Link2,
  Loader2,
  Lock,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Link } from "@/i18n/navigation";

import { PasswordInput } from "@/shares/components/common/password-input/password-input";
import { Button } from "@/shares/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/shares/components/ui/field";

import type { PublicShortLink } from "../../types/short-link.types";
import { useShortLinkLanding } from "./hooks/use-short-link-landing";

/**
 * Trích xuất domain từ URL để hiển thị trực quan cho người dùng.
 */
function extractDomain(url: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Thẻ trung gian cao cấp chuẩn shadcn UI và semantic tokens của Tailwind CSS (primary, canvas, card, warning, success).
 */
export function ShortLinkLandingCard({
  slug,
  link,
  preview = false,
}: {
  slug: string;
  link: PublicShortLink;
  preview?: boolean;
}) {
  const t = useTranslations("shortLinks.landing");
  const tShortLinks = useTranslations("shortLinks");
  const tUnavailable = useTranslations("shortLinks.unavailable");
  const passwordId = useId();
  const state = useShortLinkLanding(slug, link, preview);
  const [copied, setCopied] = useState(false);

  const error =
    state.errorCode === "SHORT_LINK_INVALID_PASSWORD"
      ? t("invalidPassword")
      : state.errorCode
        ? t("unlockError")
        : null;
  const unavailable =
    state.errorCode === "SHORT_LINK_EXPIRED"
      ? "expired"
      : state.errorCode === "RATE_LIMITED"
        ? "busy"
        : null;

  async function copyDestination() {
    if (!state.destination) return;
    try {
      await navigator.clipboard.writeText(state.destination);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Bỏ qua lỗi clipboard nếu trình duyệt chặn quyền
    }
  }

  // Giao diện khi link không khả dụng (hết hạn / quá tải / lỗi)
  if (unavailable) {
    const isExpired = unavailable === "expired";
    return (
      <div className="animate-in fade-in zoom-in-95 relative mx-auto w-full max-w-md duration-300">
        {/* Vệt hào quang phát sáng phía sau dùng token warning/destructive */}
        <div
          aria-hidden="true"
          className={`absolute -inset-1 rounded-[36px] opacity-40 blur-xl ${
            isExpired ? "bg-warning/20" : "bg-destructive/20"
          }`}
        />

        <section className="border-border bg-card/95 dark:bg-card/85 relative overflow-hidden rounded-[28px] border p-6 text-center shadow-2xl backdrop-blur-xl sm:p-7">
          <div
            aria-hidden="true"
            className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent ${
              isExpired ? "via-warning/60" : "via-destructive/60"
            } to-transparent`}
          />

          <div
            className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl ring-6 transition-transform duration-300 hover:scale-105 ${
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

          <h1 className="text-foreground text-lg font-extrabold tracking-tight text-balance break-words sm:text-xl">
            {tUnavailable(`${unavailable}.title`)}
          </h1>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed break-words sm:text-sm">
            {tUnavailable(`${unavailable}.description`)}
          </p>

          <div className="border-border/40 mt-5 flex justify-center border-t pt-3">
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

  const destinationDomain = extractDomain(state.destination);
  const totalSeconds = state.totalSeconds ?? 5;
  const progressPercent =
    state.remaining !== null && totalSeconds > 0
      ? Math.max(0, Math.min(100, (state.remaining / totalSeconds) * 100))
      : 0;

  return (
    <div className="animate-in fade-in zoom-in-95 relative mx-auto w-full max-w-lg duration-300">
      {/* Vệt viền hào quang phát sáng bằng màu primary */}
      <div
        aria-hidden="true"
        className="from-primary/25 via-primary/5 absolute -inset-1 rounded-[36px] bg-gradient-to-b to-transparent opacity-70 blur-xl transition-opacity duration-500"
      />

      <section className="border-border bg-card/95 dark:bg-card/85 relative overflow-hidden rounded-[28px] border p-5 shadow-2xl backdrop-blur-xl transition-all sm:px-7 sm:py-6">
        {/* Vệt sáng quét ngang đỉnh card bằng màu primary */}
        <div
          aria-hidden="true"
          className="via-primary/60 absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent to-transparent"
        />

        {/* ============================================================ */}
        {/* HEADER: Huy hiệu bảo mật + Mô phỏng kết nối + Tiêu đề */}
        {/* ============================================================ */}
        <div className="mb-3 flex flex-col items-center text-center">
          {/* Huy hiệu Secure Gateway với hiệu ứng ping */}
          <div className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold tracking-wide">
            <span className="relative flex size-2">
              <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-success relative inline-flex size-2 rounded-full" />
            </span>
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            <span>{t("eyebrow")}</span>
          </div>

          {/* Sơ đồ kết nối trực quan (Visual Routing Flow) */}
          <div className="border-border/60 bg-muted/40 dark:bg-muted/20 mt-2.5 mb-2 flex w-full max-w-xs items-center justify-between gap-2 rounded-xl border px-3 py-1.5">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <div className="bg-primary/15 text-primary flex size-5 items-center justify-center rounded-md">
                <Link2 aria-hidden="true" className="size-3" />
              </div>
              <span className="font-mono text-[11px]">TOANNX</span>
            </div>

            {/* Dòng xung động ở giữa */}
            <div className="flex flex-1 items-center justify-center gap-1 px-1">
              <div className="from-primary/20 to-primary h-0.5 flex-1 bg-gradient-to-r" />
              <ArrowRight aria-hidden="true" className="text-primary size-3 animate-pulse" />
              <div className="from-primary to-primary/20 h-0.5 flex-1 bg-gradient-to-r" />
            </div>

            <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <div className="bg-primary/10 text-primary flex size-5 items-center justify-center rounded-md">
                <Globe aria-hidden="true" className="size-3" />
              </div>
              <span className="max-w-[70px] truncate font-mono text-[11px]">
                {destinationDomain || "URL"}
              </span>
            </div>
          </div>

          {/* Tiêu đề trang chuyển hướng */}
          <h1 className="text-foreground mt-0.5 text-xl font-black tracking-tight text-balance break-words sm:text-2xl">
            {t("title")}
          </h1>

          {/* Mô tả chuyển hướng hoặc mô tả do người tạo đặt */}
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed break-words sm:text-sm">
            {link.description || t("subtitle")}
          </p>
        </div>

        {/* ============================================================ */}
        {/* INTERACTION AREA: Mở URL đích hoặc Form Mật khẩu */}
        {/* ============================================================ */}
        <div className="border-border/60 mt-2 border-t pt-3">
          {state.destination ? (
            <>
              {/* Terminal Box: Hiển thị URL đích an toàn */}
              <div className="border-border/80 bg-muted/40 dark:bg-muted/20 my-2.5 rounded-xl border p-3 shadow-inner transition-colors">
                <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs font-semibold">
                  <div className="text-primary flex items-center gap-1.5">
                    <Lock aria-hidden="true" className="size-3.5" />
                    <span>{t("destination")}</span>
                  </div>

                  {/* Nút sao chép URL đích */}
                  <button
                    type="button"
                    onClick={copyDestination}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-all active:scale-95"
                    title={copied ? tShortLinks("copied") : t("copyAction")}
                  >
                    {copied ? (
                      <>
                        <Check aria-hidden="true" className="text-success size-3.5" />
                        <span className="text-success font-semibold">{tShortLinks("copied")}</span>
                      </>
                    ) : (
                      <>
                        <Copy aria-hidden="true" className="size-3.5" />
                        <span>{t("copyAction")}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Domain đích lớn & URL đầy đủ */}
                <div className="mt-2">
                  {destinationDomain ? (
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold">
                        <Globe aria-hidden="true" className="size-3" />
                        {destinationDomain}
                      </span>
                    </div>
                  ) : null}
                  <p className="text-foreground/90 font-mono text-xs leading-relaxed font-medium break-all select-all">
                    {state.destination}
                  </p>
                </div>
              </div>

              {/* Chỉ báo đếm ngược công nghệ cao */}
              {state.remaining !== null && !preview ? (
                <div className="my-3">
                  {/* Thanh năng lượng dùng màu primary */}
                  <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full shadow-xs transition-all duration-1000 ease-linear"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Text đếm ngược */}
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <div className="bg-primary/15 text-primary flex size-4.5 items-center justify-center rounded-full text-[11px] font-bold">
                      {state.remaining}
                    </div>
                    <p
                      aria-live="polite"
                      className="text-muted-foreground min-h-4 text-center text-xs font-medium"
                    >
                      {t("countdown", { seconds: state.remaining })}
                    </p>
                  </div>
                </div>
              ) : (
                <p
                  aria-live="polite"
                  className="text-muted-foreground my-2.5 min-h-4 text-center text-xs font-medium"
                >
                  {t("manual")}
                </p>
              )}

              {/* Nút mở URL đích chuẩn shadcn primary button */}
              <Button
                className="group bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 relative mt-1 h-11 w-full gap-2 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] sm:h-12 sm:text-base"
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
              className="mt-2.5 flex flex-col gap-2.5 text-left"
            >
              {/* Box Vault bảo mật dùng token warning */}
              <div className="border-warning/30 bg-warning/10 dark:bg-warning/15 flex items-center gap-3 rounded-xl border p-3 text-xs sm:text-sm">
                <div className="bg-warning/20 text-warning flex size-9 shrink-0 items-center justify-center rounded-lg shadow-xs">
                  <LockKeyhole aria-hidden="true" className="size-4" />
                </div>
                <div>
                  <p className="text-foreground font-semibold">{t("protected")}</p>
                  <p className="text-muted-foreground text-xs">{t("passwordHint")}</p>
                </div>
              </div>

              <Field data-invalid={Boolean(error)}>
                <FieldLabel
                  htmlFor={passwordId}
                  className="text-foreground text-xs font-semibold sm:text-sm"
                >
                  {t("passwordLabel")}
                </FieldLabel>
                <PasswordInput
                  id={passwordId}
                  value={state.password}
                  onChange={(event) => state.setPassword(event.target.value)}
                  autoComplete="current-password"
                  maxLength={128}
                  disabled={state.isUnlocking}
                  aria-invalid={Boolean(error)}
                  required
                />
                {error ? (
                  <FieldError className="flex items-center gap-1.5 pt-0.5 text-xs">
                    <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                    <span>{error}</span>
                  </FieldError>
                ) : null}
              </Field>

              {/* Nút Mở khóa chuẩn primary */}
              <Button
                type="submit"
                className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 mt-0.5 h-11 w-full gap-2 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] sm:text-base"
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

        {/* Nút nhỏ quay về trang chủ */}
        <div className="border-border/40 mt-3.5 flex justify-center border-t pt-2.5">
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
        </div>
      </section>
    </div>
  );
}
