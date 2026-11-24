"use client";

import Image from "next/image";
import { Check, Copy, CreditCard, Palette, QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "cn";

import { AttachmentImageUploadView } from "@/modules/system/views/attachment/attachment-image-upload-view";
import { ColorInput } from "@/shares/components/common/color-input";
import { SelectField } from "@/shares/components/common/select-field";
import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";
import { normalizeMediaUrl } from "@/shares/lib/asset-paths";

import type { DonationQrItem, QrAccountType } from "../../types/page.types";
import { usePageDonationQrDialog } from "./hooks/use-page-donation-qr-dialog";

const POPULAR_BANKS = [
  { shortName: "MBBank", bin: "970422" },
  { shortName: "Vietcombank", bin: "970436" },
  { shortName: "Techcombank", bin: "970407" },
  { shortName: "BIDV", bin: "970418" },
  { shortName: "ACB", bin: "970416" },
  { shortName: "VPBank", bin: "970432" },
  { shortName: "Agribank", bin: "970405" },
  { shortName: "TPBank", bin: "970423" },
];

export interface PageDonationQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialItem?: DonationQrItem | null;
  onSave: (item: DonationQrItem) => void;
}

/**
 * Hộp thoại tạo và chỉnh sửa phương thức nhận tiền / Mã QR cho trang Quyên góp (Donation):
 * Hỗ trợ VietQR ngân hàng và Mã QR tùy chỉnh (tải ảnh lên) kèm xem trước trực tiếp.
 * Layout chia cột linh hoạt, chống tràn khung và tối ưu responsive trên mọi thiết bị.
 */
export function PageDonationQrDialog({
  open,
  onOpenChange,
  initialItem,
  onSave,
}: PageDonationQrDialogProps) {
  const t = useTranslations("utilities.customPages.pages.donationEditor");

  const state = usePageDonationQrDialog({
    initialItem,
    onSave,
    onClose: () => onOpenChange(false),
  });

  const [hasPreviewError, setHasPreviewError] = useState(false);
  const [prevPreviewSvg, setPrevPreviewSvg] = useState(state.previewSvg);

  if (state.previewSvg !== prevPreviewSvg) {
    setPrevPreviewSvg(state.previewSvg);
    setHasPreviewError(false);
  }

  const QR_TYPE_OPTIONS: Array<{ value: QrAccountType; label: string }> = [
    { value: "BANK_TRANSFER", label: t("qrTypeBank") },
    { value: "CUSTOM", label: t("qrTypeCustom") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-x-hidden overflow-y-auto p-4 sm:max-w-3xl sm:p-6 md:max-w-4xl md:p-8 lg:max-w-5xl">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <QrCode className="text-primary size-5" />
            <span>{initialItem ? t("editQrMethod") : t("addQrMethod")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Cột trái: Cấu hình thông tin tài khoản & Kiểu dáng */}
          <div className="w-full min-w-0 space-y-4 md:col-span-7">
            {/* 1. Chọn loại phương thức */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t("qrType")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {QR_TYPE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={state.type === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => state.handleTypeChange(opt.value)}
                    className="h-8 px-2.5 text-xs font-normal"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 2. Cấu hình chi tiết */}
            {state.type === "BANK_TRANSFER" ? (
              <Tabs defaultValue="account" className="w-full min-w-0">
                <TabsList className="mb-3 grid w-full grid-cols-2 p-1">
                  <TabsTrigger
                    value="account"
                    className="flex items-center justify-center gap-1.5 truncate px-2.5 py-1.5 text-xs"
                  >
                    <CreditCard className="size-3.5 shrink-0" />
                    <span className="truncate">{t("tabAccount")}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="design"
                    className="flex items-center justify-center gap-1.5 truncate px-2.5 py-1.5 text-xs"
                  >
                    <Palette className="size-3.5 shrink-0" />
                    <span className="truncate">{t("tabDesign")}</span>
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Thông tin tài khoản VietQR */}
                <TabsContent value="account" className="mt-0 space-y-3.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">{t("methodTitle")}</Label>
                    <Input
                      value={state.title}
                      onChange={(e) => state.setTitle(e.target.value)}
                      placeholder={t("methodTitlePlaceholder")}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("bankSelect")}</Label>
                    <div className="flex flex-wrap gap-1 pb-1">
                      {POPULAR_BANKS.map((b) => (
                        <Button
                          key={b.bin}
                          type="button"
                          variant={state.bankBin === b.bin ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => state.handleBankChange(b.bin)}
                          className="h-6 px-2 text-[11px] font-normal"
                        >
                          {b.shortName}
                        </Button>
                      ))}
                    </div>
                    <SelectField
                      value={state.bankBin}
                      onValueChange={state.handleBankChange}
                      searchable
                      disabled={state.isBanksLoading}
                      options={state.banks.map((b) => ({
                        value: b.bin,
                        label: b.shortName,
                        description: b.name,
                      }))}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 text-xs font-medium">
                        <span>{t("accountNumber")}</span>
                        <span
                          aria-hidden
                          className="text-destructive text-sm leading-none font-medium"
                        >
                          *
                        </span>
                      </Label>
                      <Input
                        inputMode="numeric"
                        value={state.accountNumber}
                        onChange={(e) => state.setAccountNumber(e.target.value)}
                        placeholder={t("accountNumberPlaceholder")}
                        className="h-9 font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 text-xs font-medium">
                        <span>{t("accountHolder")}</span>
                        <span
                          aria-hidden
                          className="text-destructive text-sm leading-none font-medium"
                        >
                          *
                        </span>
                      </Label>
                      <Input
                        value={state.accountHolder}
                        onChange={(e) => state.setAccountHolder(e.target.value.toUpperCase())}
                        placeholder={t("accountHolderPlaceholder")}
                        className="h-9 text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">{t("qrNote")}</Label>
                    <Input
                      value={state.note}
                      onChange={(e) => state.setNote(e.target.value)}
                      placeholder={t("qrNotePlaceholder")}
                      maxLength={50}
                      className="h-9 text-xs"
                    />
                  </div>
                </TabsContent>

                {/* Tab 2: Tùy biến kiểu dáng mã VietQR */}
                <TabsContent value="design" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("qrColor")}</Label>
                      <ColorInput
                        value={state.foreground}
                        onChange={state.setForeground}
                        pickerLabel={t("qrColor")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("bgColor")}</Label>
                      <ColorInput
                        value={state.background}
                        onChange={state.setBackground}
                        pickerLabel={t("bgColor")}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("qrLogo")}</Label>
                    <AttachmentImageUploadView
                      value={
                        state.logoId
                          ? {
                              id: state.logoId,
                              url: state.logoUrl ?? "",
                              name: "Logo",
                              contentType: "image/png",
                            }
                          : null
                      }
                      onChange={(file) => {
                        state.setLogoId(file?.id ?? null);
                        state.setLogoUrl(file?.url);
                        if (file) {
                          state.setErrorCorrection("H");
                          state.setMargin(Math.max(4, state.margin));
                        }
                      }}
                      shape="square"
                      hint={t("qrLogoHint")}
                      aria-label={t("qrLogo")}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              /* Cấu hình cho phương thức tùy chỉnh tải ảnh (MoMo, ZaloPay, PayPal, v.v.) */
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-xs font-medium">
                    <span>{t("methodTitle")}</span>
                    <span aria-hidden className="text-destructive text-sm leading-none font-medium">
                      *
                    </span>
                  </Label>
                  <Input
                    value={state.title}
                    onChange={(e) => state.setTitle(e.target.value)}
                    placeholder={t("customTitlePlaceholder")}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs font-medium">
                    <span>{t("customQrImage")}</span>
                    <span aria-hidden className="text-destructive text-sm leading-none font-medium">
                      *
                    </span>
                  </Label>
                  <AttachmentImageUploadView
                    value={
                      state.customImageId
                        ? {
                            id: state.customImageId,
                            url: state.customImageUrl ?? "",
                            name: "Mã QR",
                            contentType: "image/png",
                          }
                        : null
                    }
                    onChange={(file) => {
                      state.setCustomImageId(file?.id ?? null);
                      state.setCustomImageUrl(file?.url);
                    }}
                    shape="square"
                    hint={t("customQrImageHint")}
                    aria-label={t("customQrImage")}
                  />
                </div>

                <div className="grid items-start gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">{t("customAccountInfo")}</Label>
                    <Input
                      value={state.accountNumber}
                      onChange={(e) => state.setAccountNumber(e.target.value)}
                      placeholder={t("customAccountPlaceholder")}
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">{t("accountHolder")}</Label>
                    <Input
                      value={state.accountHolder}
                      onChange={(e) => state.setAccountHolder(e.target.value.toUpperCase())}
                      placeholder={t("accountHolderPlaceholder")}
                      className="h-9 text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">{t("qrNote")}</Label>
                  <Input
                    value={state.note}
                    onChange={(e) => state.setNote(e.target.value)}
                    placeholder={t("qrNotePlaceholder")}
                    maxLength={50}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: Live Preview mô phỏng màn hình thật */}
          <div className="bg-muted/15 flex w-full min-w-0 flex-col items-center justify-start self-start rounded-2xl border border-dashed p-3 sm:p-4 md:sticky md:top-2 md:col-span-5">
            <div className="mb-3 flex w-full items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {t("livePreview")}
              </span>
              <span className="text-muted-foreground/80 font-mono text-[10px]">
                {t("mockPhoneScreen")}
              </span>
            </div>

            {/* Khung mô phỏng Card phương thức trên trang quyên góp thật */}
            <div className="border-border bg-card w-full max-w-[280px] rounded-2xl border p-3.5 shadow-xs sm:p-4">
              {/* Tab phương thức giả lập đang được chọn */}
              <div className="mb-3 flex justify-center">
                <span className="bg-primary text-primary-foreground inline-flex h-7 items-center gap-1.5 rounded-xl px-3 text-xs font-medium shadow-2xs">
                  <span className="text-[10px] opacity-80">
                    [{state.type === "BANK_TRANSFER" ? "VietQR" : t("livePreviewBadgeCustom")}]
                  </span>
                  <span className="max-w-[140px] truncate">
                    {state.title || (state.type === "BANK_TRANSFER" ? "MBBank" : "Ví MoMo")}
                  </span>
                </span>
              </div>

              {/* Khung ảnh mã QR */}
              <div
                className={cn(
                  "border-border bg-muted/40 relative mb-3 flex flex-col items-center justify-center overflow-hidden rounded-2xl border p-2.5 shadow-inner transition-all",
                  state.type === "CUSTOM" ? "h-56 w-full max-w-[240px]" : "size-48 sm:size-52",
                )}
              >
                {state.previewSvg && !hasPreviewError ? (
                  <div className="relative size-full">
                    <Image
                      src={normalizeMediaUrl(state.previewSvg)}
                      alt={t("livePreview")}
                      fill
                      sizes="240px"
                      unoptimized
                      onError={() => setHasPreviewError(true)}
                      className="object-contain p-1"
                    />
                  </div>
                ) : state.isPreviewLoading ? (
                  <Skeleton className="size-full rounded-xl" />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center justify-center gap-1.5 p-3 text-center text-xs">
                    <QrCode className="text-muted-foreground/60 size-16 stroke-1" />
                    <span className="text-muted-foreground text-[11px] leading-tight">
                      {state.type === "CUSTOM" ? "Chưa có ảnh mã QR" : t("vietQrHint")}
                    </span>
                  </div>
                )}
              </div>

              {/* Bảng thông tin tài khoản */}
              <div className="border-border bg-muted/30 w-full space-y-2 rounded-xl border p-3 text-xs">
                {/* Hàng 1: Ngân hàng / Phương thức */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {state.type === "CUSTOM" ? t("previewMethodLabel") : t("previewBankLabel")}
                  </span>
                  <span className="text-foreground max-w-[145px] truncate font-semibold">
                    {state.title ||
                      (state.type === "BANK_TRANSFER" ? state.bankName : "Ví điện tử")}
                  </span>
                </div>

                {/* Hàng 2: Chủ tài khoản (chỉ hiện khi có nhập) */}
                {state.accountHolder ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("accountHolder")}</span>
                    <span className="text-foreground max-w-[145px] truncate font-semibold uppercase">
                      {state.accountHolder}
                    </span>
                  </div>
                ) : null}

                {/* Hàng 3: Số tài khoản */}
                <div className="border-border flex items-center justify-between border-t pt-2">
                  <span className="text-muted-foreground">{t("accountNumber")}</span>
                  <div className="flex items-center gap-1.5">
                    {state.accountNumber ? (
                      <span className="text-primary font-mono text-xs font-bold">
                        {state.accountNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[11px] italic">
                        {t("noAccountEntered")}
                      </span>
                    )}
                    <Copy className="text-muted-foreground/70 size-3" />
                  </div>
                </div>

                {/* Hàng 4: Lời nhắn (nếu có) */}
                {state.note ? (
                  <div className="border-border text-muted-foreground truncate border-t pt-1.5 text-[11px] italic">
                    Nội dung: &ldquo;
                    {state.type === "BANK_TRANSFER" &&
                    !state.note.toLowerCase().startsWith("donate")
                      ? `donate ${state.note}`
                      : state.note}
                    &rdquo;
                  </div>
                ) : null}
              </div>

              {/* Dòng hướng dẫn ở chân thẻ */}
              <p className="text-muted-foreground mt-3 text-center text-[10px] leading-tight">
                {state.type === "CUSTOM" ? t("previewScanCustom") : t("previewScanBank")}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={
              state.type === "BANK_TRANSFER"
                ? !state.accountNumber.trim()
                : !state.title.trim() || !state.customImageUrl
            }
            onClick={state.handleSubmit}
          >
            <Check className="mr-1.5 size-4" />
            <span>{t("saveMethod")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
