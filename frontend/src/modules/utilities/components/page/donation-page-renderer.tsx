"use client";

import Image from "next/image";
import { Check, Copy, CreditCard, QrCode } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { cn } from "cn";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { CURRENCY_SYMBOLS } from "@/shares/constants/currency";
import { normalizeMediaUrl } from "@/shares/lib/asset-paths";
import {
  APP_NUMBER_LOCALE,
  formatDisplayNumber,
  formatVndText,
  getNumberLocale,
} from "@/shares/lib/number-format";
import { toSafeImageSrc } from "@/shares/lib/safe-url";

import { useResolvedPageTheme } from "../../hooks/use-resolved-page-theme";
import type { DonationQrItem, PublicPage } from "../../types/page.types";
import { useDonationPageRenderer } from "./hooks/use-donation-page-renderer";
import { DonationPublicFeed } from "./donation-public-feed";
import { PresetAmountIcon } from "./preset-amount-icon";

/**
 * Phân tích và tách biệt nhãn mô tả và số tiền hiển thị cho các mốc ủng hộ gợi ý.
 * Chống tràn viền, loại bỏ lặp số tiền và tối ưu giao diện 2 dòng cân đối.
 */
export function parsePresetAmount(
  opt: { amount: number; label: string },
  numberLocale = APP_NUMBER_LOCALE,
) {
  const formattedAmount = formatVndText(opt.amount, numberLocale);
  if (!opt.label || opt.label.trim() === "" || opt.label.trim() === formattedAmount) {
    return { title: null, amount: formattedAmount };
  }

  // Tách phần tên mô tả nếu nhãn có chứa tiền ở cuối dạng "(xxx đ)" hoặc "- xxx đ"
  const rawTitle = opt.label
    .replace(/\s*\(\s*\d+[\d.,]*\s*([₫đ]|VND|vnđ)?\s*\)\s*$/i, "")
    .replace(/\s*[-–—:]\s*\d+[\d.,]*\s*([₫đ]|VND|vnđ)?\s*$/i, "")
    .trim();

  if (
    rawTitle &&
    rawTitle !== formattedAmount &&
    !/^\d+[\d.,]*\s*([₫đ]|VND|vnđ)?$/i.test(rawTitle)
  ) {
    return { title: rawTitle, amount: formattedAmount };
  }

  return { title: null, amount: opt.label.trim() || formattedAmount };
}

/**
 * Hiển thị trang Quyên góp / Ủng hộ (Donation Page) với mã QR thật (VietQR, Tùy chỉnh tải ảnh),
 * hỗ trợ tùy chọn một mã hoặc nhiều mã phương thức, giao diện Fintech sang trọng và tối ưu UX.
 *
 * @param props - Dữ liệu trang công khai.
 * @returns Giao diện trang Donation.
 */
export function DonationPageRenderer({ page }: { page: PublicPage }) {
  const t = useTranslations("utilities.customPages.donation");
  const locale = useLocale();
  const numberLocale = getNumberLocale(locale);
  const config = page.contentConfig as unknown as Record<string, unknown> | undefined;

  const creatorConfig = (config?.creator ?? {}) as Record<string, unknown>;
  const avatarUrl = toSafeImageSrc(
    page.avatarUrl ||
      (config?.avatarUrl as string) ||
      (config?.avatar_url as string) ||
      (creatorConfig.avatarUrl as string) ||
      (creatorConfig.avatar_url as string),
  );
  const coverUrl = toSafeImageSrc(
    page.coverUrl ||
      (config?.coverUrl as string) ||
      (config?.cover_url as string) ||
      (creatorConfig.coverUrl as string) ||
      (creatorConfig.cover_url as string),
  );

  const fallbackBank = useMemo(() => {
    const rawBank = (config?.bankAccount ?? config?.bank_account ?? {}) as Record<string, unknown>;
    return {
      bankName: String(rawBank.bankName ?? rawBank.bank_name ?? "MBBank"),
      accountNumber: String(rawBank.accountNumber ?? rawBank.account_number ?? "9999999999"),
      accountHolder: String(rawBank.accountHolder ?? rawBank.account_holder ?? "NGUYEN XUAN TOAN"),
    };
  }, [config]);

  const displayMode = (config?.displayMode as string) ?? "multiple";
  const rawQrCodes = (config?.qrCodes ?? config?.qr_codes) as unknown[];

  // Chuẩn hóa danh sách mã QR
  const qrCodes: DonationQrItem[] = useMemo(() => {
    if (Array.isArray(rawQrCodes) && rawQrCodes.length > 0) {
      return rawQrCodes.map((item, idx) => {
        const q = (item ?? {}) as Record<string, unknown>;
        const rawDesign = (q.design ?? {}) as Record<string, unknown>;
        return {
          id: String(q.id ?? `qr-${idx}`),
          type: (q.type as DonationQrItem["type"]) ?? "BANK_TRANSFER",
          title: String(q.title ?? q.bankName ?? q.bank_name ?? t("accountFallback")),
          bankBin: q.bankBin ? String(q.bankBin) : undefined,
          bankName: q.bankName ? String(q.bankName) : undefined,
          accountNumber: String(q.accountNumber ?? q.account_number ?? ""),
          accountHolder: String(q.accountHolder ?? q.account_holder ?? ""),
          note: q.note ? String(q.note) : undefined,
          isDefault: Boolean(q.isDefault ?? q.is_default),
          design: {
            foreground: String(rawDesign.foreground ?? "#000000"),
            background: String(rawDesign.background ?? "#ffffff"),
            margin: Number(rawDesign.margin ?? 2),
            size: Number(rawDesign.size ?? 512),
            errorCorrection: (rawDesign.errorCorrection as "L" | "M" | "Q" | "H") ?? "M",
          },
          logoId: q.logoId ? String(q.logoId) : null,
          logoUrl: q.logoUrl ? String(q.logoUrl) : undefined,
          previewSvg: q.previewSvg
            ? String(q.previewSvg)
            : q.preview_svg
              ? String(q.preview_svg)
              : undefined,
          customImageId: q.customImageId
            ? String(q.customImageId)
            : q.custom_image_id
              ? String(q.custom_image_id)
              : undefined,
          customImageUrl: q.customImageUrl
            ? String(q.customImageUrl)
            : q.custom_image_url
              ? String(q.custom_image_url)
              : undefined,
        };
      });
    }

    // Fallback sang cấu hình mặc định
    return [
      {
        id: "qr-default-legacy",
        type: "BANK_TRANSFER",
        title: fallbackBank.bankName,
        bankName: fallbackBank.bankName,
        bankBin: "970422",
        accountNumber: fallbackBank.accountNumber,
        accountHolder: fallbackBank.accountHolder,
        isDefault: true,
      },
    ];
  }, [rawQrCodes, fallbackBank, t]);

  const rawSuggested = config?.suggestedAmounts ?? config?.suggested_amounts;
  const suggestedAmounts: { amount: number; label: string; icon?: string }[] = useMemo(() => {
    if (!rawSuggested || !Array.isArray(rawSuggested) || rawSuggested.length === 0) {
      return [
        { amount: 30000, label: formatVndText(30000, numberLocale), icon: "coffee" },
        { amount: 50000, label: formatVndText(50000, numberLocale), icon: "coffee" },
        { amount: 100000, label: formatVndText(100000, numberLocale), icon: "utensils" },
      ];
    }
    return rawSuggested
      .map((item) => {
        if (typeof item === "number") {
          return {
            amount: item,
            label: formatVndText(item, numberLocale),
          };
        }
        if (typeof item === "string") {
          const num = Number(item);
          return isNaN(num)
            ? null
            : {
                amount: num,
                label: formatVndText(num, numberLocale),
              };
        }
        if (typeof item === "object" && item !== null) {
          const rawAmount = (item as Record<string, unknown>).amount;
          const num = Number(rawAmount);
          if (isNaN(num)) return null;
          const rawLabel = (item as Record<string, unknown>).label;
          const label = String(rawLabel ?? formatVndText(num, numberLocale));
          const rawIcon = (item as Record<string, unknown>).icon;
          const icon = typeof rawIcon === "string" ? rawIcon : undefined;
          return { amount: num, label, icon };
        }
        return null;
      })
      .filter((item): item is { amount: number; label: string; icon?: string } => item !== null);
  }, [numberLocale, rawSuggested]);

  const minAmount = Number(config?.minAmount ?? config?.min_amount ?? 10000) || 10000;
  const allowCustomAmount = Boolean(
    config?.allowCustomAmount ?? config?.allow_custom_amount ?? true,
  );

  const {
    activeQrId,
    setActiveQrId,
    activeQr,
    currentAccountNumber,
    copied,
    copiedNote,
    selectedAmount,
    customAmountText,
    customNote,
    transferNote,
    vietQrNote,
    isBelowMin,
    handleSelectPresetAmount,
    handleCustomAmountChange,
    handleClearAmount,
    handleCustomNoteChange,
    handleCopyAccount,
    handleCopyNote,
  } = useDonationPageRenderer(qrCodes, fallbackBank.accountNumber, minAmount, displayMode);

  const { pageThemeScope, buttonStyle, customStyle } = useResolvedPageTheme(page);
  const buttonRadiusClass =
    buttonStyle === "square"
      ? "rounded-none"
      : buttonStyle === "pill"
        ? "rounded-full"
        : "rounded-2xl";

  const rawCreator = (config?.creator ?? {}) as Record<string, unknown>;
  const creatorMessage = String(
    rawCreator.message ?? rawCreator.thankYouMessage ?? rawCreator.thank_you_message ?? "",
  );

  // Tính toán ảnh mã QR tối ưu
  const qrImageSrc = useMemo(() => {
    if (!activeQr) return null;

    // Chuẩn hóa toàn bộ mã QR chuyển tiền ngân hàng sang chuẩn VietQR img.vietqr.io compact2.svg
    if (
      activeQr.type === "BANK_TRANSFER" &&
      (activeQr.accountNumber || fallbackBank.accountNumber)
    ) {
      const bankId = activeQr.bankBin || "970422";
      const acc = activeQr.accountNumber || fallbackBank.accountNumber;
      const holder = encodeURIComponent(
        (activeQr.accountHolder || fallbackBank.accountHolder || "").toUpperCase(),
      );
      const note = encodeURIComponent(vietQrNote || "donate");

      if (selectedAmount && selectedAmount > 0) {
        return `https://img.vietqr.io/image/${bankId}-${acc}-compact2.svg?amount=${selectedAmount}&addInfo=${note}&accountName=${holder}`;
      }
      return `https://img.vietqr.io/image/${bankId}-${acc}-compact2.svg?addInfo=${note}&accountName=${holder}`;
    }

    // Phương thức Tùy chỉnh (ảnh mã QR do người dùng tải lên)
    if (activeQr.type === "CUSTOM") {
      return toSafeImageSrc(activeQr.customImageUrl || activeQr.previewSvg) || null;
    }

    // Nếu đã có previewSvg từ hệ thống
    if (activeQr.previewSvg) {
      return toSafeImageSrc(activeQr.previewSvg) || null;
    }

    return null;
  }, [activeQr, fallbackBank, selectedAmount, vietQrNote]);

  const showMultipleTabs = displayMode === "multiple" && qrCodes.length > 1;

  const getMethodBadgeName = (type: DonationQrItem["type"]) => {
    switch (type) {
      case "BANK_TRANSFER":
        return "VietQR";
      case "CUSTOM":
        return t("customType");
      default:
        return "QR";
    }
  };

  return (
    <main
      style={customStyle}
      data-page-theme={pageThemeScope}
      className={cn(
        "bg-background text-foreground flex min-h-svh flex-col items-center transition-colors duration-200",
        coverUrl ? "pb-16 sm:pb-20" : "px-4 py-8 sm:py-14",
      )}
    >
      {/* 1. Ảnh bìa / Thumbnail */}
      {coverUrl ? (
        <div className="relative h-40 w-full overflow-hidden sm:h-56">
          <Image
            src={normalizeMediaUrl(coverUrl)}
            alt={page.title}
            fill
            sizes="100vw"
            priority
            unoptimized
            className="object-cover"
          />
          <div className="from-background/70 absolute inset-0 bg-gradient-to-t to-transparent" />
        </div>
      ) : null}

      <div className={cn("w-full max-w-xl sm:max-w-2xl", coverUrl && "px-4 pt-4")}>
        {/* 2. Header Lời nhắn & Avatar / Logo */}
        <header className="mb-6 text-center">
          {avatarUrl ? (
            <div
              className={cn(
                "ring-primary/20 bg-card relative mx-auto mb-3 size-18 shrink-0 overflow-hidden rounded-full shadow-xl ring-4 sm:size-22",
                coverUrl && "-mt-12 sm:-mt-16",
              )}
            >
              <Image
                src={normalizeMediaUrl(avatarUrl)}
                alt={page.title}
                fill
                sizes="88px"
                unoptimized
                className="object-cover"
              />
            </div>
          ) : null}

          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{page.title}</h1>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-xs leading-relaxed sm:text-sm">
            {creatorMessage || page.description || t("defaultMessage")}
          </p>
        </header>

        {/* 3. Khung Thẻ QR & Phương thức nhận tiền */}
        <div className="border-border/80 bg-card shadow-primary/5 rounded-3xl border p-4 shadow-xl sm:p-6">
          {/* Thanh chọn phương thức (khi ở chế độ nhiều mã) */}
          {showMultipleTabs && (
            <div className="mb-5 space-y-2">
              <span className="text-muted-foreground block text-center text-xs font-semibold tracking-wider uppercase">
                {t("selectMethod")}
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {qrCodes.map((item) => {
                  const isActive = item.id === activeQrId;
                  return (
                    <Button
                      key={item.id}
                      type="button"
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveQrId(item.id)}
                      className={cn(
                        "h-8 gap-1.5 px-3 text-xs font-semibold shadow-2xs transition-all",
                        buttonRadiusClass,
                      )}
                    >
                      <span className="text-[10px] opacity-80">
                        [{getMethodBadgeName(item.type)}]
                      </span>
                      <span>{item.title}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center">
            {/* Khung quét mã QR chuẩn Fintech Scanner */}
            <div
              className={cn(
                "relative mb-5 flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-neutral-200/90 bg-white p-3 shadow-md dark:border-neutral-800",
                activeQr?.type === "CUSTOM"
                  ? "h-60 w-full max-w-[260px] sm:h-72 sm:max-w-[280px]"
                  : "size-60 sm:size-68",
              )}
            >
              {/* Trang trí 4 góc scanner */}
              <div className="pointer-events-none absolute inset-2.5 rounded-2xl border-2 border-dashed border-neutral-200/70" />

              {qrImageSrc ? (
                <div className="relative z-10 size-full">
                  <Image
                    src={normalizeMediaUrl(qrImageSrc)}
                    alt={activeQr?.title || t("qrAlt")}
                    fill
                    sizes="(max-width: 640px) 280px, 280px"
                    unoptimized
                    className="object-contain p-2"
                  />
                </div>
              ) : (
                <div className="z-10 flex flex-col items-center justify-center gap-2 text-neutral-500">
                  <QrCode className="size-28 opacity-80" />
                  <span className="text-xs font-medium">{t("vietQrHint")}</span>
                </div>
              )}
            </div>

            {/* Thẻ Ngân hàng Số (Fintech Digital Card) */}
            <div className="border-border/80 from-card via-muted/30 to-muted/60 w-full space-y-2.5 rounded-2xl border bg-gradient-to-br p-3.5 shadow-2xs sm:p-4">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="text-muted-foreground flex shrink-0 items-center gap-1.5">
                  <CreditCard className="text-primary size-3.5" />
                  <span>{activeQr?.type === "CUSTOM" ? t("methodLabel") : t("bank")}</span>
                </div>
                <span className="text-foreground min-w-0 text-right font-bold break-words">
                  {activeQr?.title || activeQr?.bankName || fallbackBank.bankName}
                </span>
              </div>

              {activeQr?.accountHolder && (
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground shrink-0">{t("accountHolder")}</span>
                  <span className="text-foreground min-w-0 text-right font-bold tracking-wider break-words uppercase">
                    {activeQr.accountHolder}
                  </span>
                </div>
              )}

              {currentAccountNumber ? (
                <div className="border-border/60 flex items-center justify-between gap-3 border-t pt-2.5 text-xs">
                  <span className="text-muted-foreground shrink-0">{t("accountNumber")}</span>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-primary font-mono text-sm font-extrabold tracking-wider break-all sm:text-base">
                      {currentAccountNumber}
                    </span>
                    <AppTooltip content={t("copyAccount")}>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="outline"
                        onClick={handleCopyAccount}
                        aria-label={t("copyAccount")}
                        className="border-border/80 bg-background/80 hover:bg-muted size-7 shrink-0 rounded-lg shadow-2xs transition-all"
                      >
                        {copied ? (
                          <Check className="size-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </AppTooltip>
                  </div>
                </div>
              ) : null}

              {activeQr?.type === "BANK_TRANSFER" && (
                <div className="border-border/60 flex items-center justify-between gap-3 border-t pt-2.5 text-xs">
                  <span className="text-muted-foreground shrink-0">{t("transferNote")}</span>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-primary truncate font-mono text-xs font-bold">
                      {transferNote}
                    </span>
                    <AppTooltip content={t("copyNote")}>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="outline"
                        onClick={handleCopyNote}
                        aria-label={t("copyNote")}
                        className="border-border/80 bg-background/80 hover:bg-muted size-7 shrink-0 rounded-lg shadow-2xs transition-all"
                      >
                        {copiedNote ? (
                          <Check className="size-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </AppTooltip>
                  </div>
                </div>
              )}

              {activeQr?.type !== "BANK_TRANSFER" && activeQr?.note && (
                <div className="border-border/60 text-muted-foreground border-t pt-2 text-[11px] italic">
                  {t("notePrefix")} &ldquo;{activeQr.note}&rdquo;
                </div>
              )}
            </div>

            {/* 4. Cấu hình số tiền & Lời nhắn chuyển khoản (với VietQR) */}
            {activeQr?.type === "BANK_TRANSFER" && (
              <div className="mt-5 w-full space-y-3.5">
                {/* Ô nhập nội dung chuyển khoản với tiền tố donate */}
                <div className="border-border/80 bg-muted/25 space-y-2 rounded-2xl border p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-semibold">{t("transferNoteLabel")}</span>
                    {customNote ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCustomNoteChange("")}
                        className="text-muted-foreground hover:text-foreground h-6 px-1.5 text-[11px]"
                      >
                        {t("clearAmount")}
                      </Button>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary border-primary/20 inline-flex h-9 shrink-0 items-center rounded-lg border px-3 font-mono text-xs font-bold shadow-2xs">
                        donate
                      </span>
                      <Input
                        value={customNote}
                        onChange={(e) => handleCustomNoteChange(e.target.value)}
                        placeholder={t("transferNotePlaceholder")}
                        maxLength={60}
                        className="h-9 flex-1 text-xs font-semibold shadow-2xs"
                      />
                    </div>
                    <p className="text-muted-foreground text-[10px] leading-tight">
                      {t("transferNotePrefixHint")}
                    </p>
                  </div>
                </div>

                {/* Ô nhập số tiền tùy chọn */}
                {allowCustomAmount && (
                  <div className="border-border/80 bg-muted/25 space-y-2 rounded-2xl border p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-semibold">
                        {t("customAmountLabel")}
                      </span>
                      {selectedAmount ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearAmount}
                          className="text-muted-foreground hover:text-foreground h-6 px-1.5 text-[11px]"
                        >
                          {t("clearAmount")}
                        </Button>
                      ) : null}
                    </div>

                    <div className="relative flex items-center">
                      <Input
                        inputMode="numeric"
                        value={customAmountText}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        placeholder={t("customAmountPlaceholder")}
                        className="h-9 pr-8 text-xs font-semibold shadow-2xs"
                      />
                      <span className="text-muted-foreground pointer-events-none absolute right-3 text-xs font-bold">
                        {CURRENCY_SYMBOLS.VND}
                      </span>
                    </div>

                    {isBelowMin ? (
                      <p className="text-[11px] font-medium text-rose-500">
                        {t("minAmountWarning", {
                          min: formatDisplayNumber(minAmount, { locale: numberLocale }),
                        })}
                      </p>
                    ) : null}
                  </div>
                )}

                {/* Các mốc số tiền gợi ý (Fintech Bento Preset Chips) */}
                {suggestedAmounts.length > 0 && (
                  <div className="w-full min-w-0">
                    <span className="text-muted-foreground mb-2.5 block text-center text-xs font-semibold tracking-wider uppercase">
                      {t("suggestedAmountTitle")}
                    </span>
                    <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                      {suggestedAmounts.map((opt, index) => {
                        const isSelected = selectedAmount === opt.amount;
                        const isOddLast =
                          suggestedAmounts.length % 2 !== 0 &&
                          index === suggestedAmounts.length - 1;
                        const preset = parsePresetAmount(opt, numberLocale);
                        const noteTitle = preset.title || "";

                        return (
                          <Button
                            key={`${opt.amount}-${index}`}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSelectPresetAmount(opt.amount, noteTitle)}
                            className={cn(
                              "border-border/80 group hover:border-primary/50 relative flex h-auto min-h-13.5 w-full max-w-full min-w-0 flex-col items-center justify-center overflow-hidden px-2.5 py-2 text-center whitespace-normal shadow-2xs transition-all duration-200 hover:shadow-xs",
                              buttonStyle === "pill" ? "rounded-full px-3.5" : "rounded-2xl px-2.5",
                              isOddLast && "min-[360px]:col-span-2",
                              isSelected && "border-primary ring-primary/30 shadow-sm ring-2",
                            )}
                          >
                            {preset.title ? (
                              <div className="flex w-full max-w-full min-w-0 items-center justify-center gap-1 px-0.5 text-[11px] leading-tight font-medium opacity-90">
                                <PresetAmountIcon
                                  title={preset.title}
                                  customIcon={opt.icon}
                                  className="size-3 shrink-0"
                                />
                                <span className="truncate">{preset.title}</span>
                              </div>
                            ) : null}
                            <span className="mt-0.5 w-full max-w-full truncate px-0.5 font-mono text-xs leading-tight font-extrabold tracking-tight sm:text-sm">
                              {preset.amount}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-muted-foreground mt-5 text-center text-[11px] leading-tight">
              {activeQr?.type === "CUSTOM" ? t("scanToPayCustom") : t("scanToPay")}
            </p>
          </div>
        </div>

        {/* 4. Bảng Vinh danh đếm ngược & Lịch sử ủng hộ */}
        <DonationPublicFeed
          pageId={page.id ?? ""}
          preview={Boolean(page.preview)}
          hideAmount={Boolean(
            config?.hideAmount ??
            config?.hide_amount ??
            activeQr?.hideAmount ??
            qrCodes.some((q) => (q as unknown as Record<string, unknown>).hideAmount),
          )}
        />
      </div>
    </main>
  );
}
