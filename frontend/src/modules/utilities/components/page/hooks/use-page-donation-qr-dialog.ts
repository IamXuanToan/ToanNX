"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useQrBanks } from "../../../hooks/use-qr-banks";
import type { DonationQrItem, QrAccountType } from "../../../types/page.types";

const PREVIEW_DELAY_MS = 250;

/**
 * Sinh token ngẫu nhiên mật mã học cho webhook SePay (không dùng timestamp dễ đoán).
 */
function generateSecureWebhookToken(): string {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    if (typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    }
  }
  return "";
}

export interface UsePageDonationQrDialogProps {
  initialItem?: DonationQrItem | null;
  onSave: (item: DonationQrItem) => void;
  onClose: () => void;
}

/**
 * Hook quản lý trạng thái cho Dialog tạo / sửa mã QR trong trang Quyên góp (Donation):
 * Hỗ trợ phương thức VietQR tự động, phương thức Tùy chỉnh (tải ảnh),
 * cấu hình Webhook SePay trực tiếp cho mã QR và tùy chọn ẩn số tiền nhận được.
 */
export function usePageDonationQrDialog({
  initialItem,
  onSave,
  onClose,
}: UsePageDonationQrDialogProps) {
  const t = useTranslations("utilities.customPages.pages.donationEditor");
  const banks = useQrBanks();

  const [type, setType] = useState<QrAccountType>(initialItem?.type ?? "BANK_TRANSFER");
  const [title, setTitle] = useState(initialItem?.title ?? "MBBank");
  const [bankBin, setBankBin] = useState(initialItem?.bankBin ?? "970422");
  const [bankName, setBankName] = useState(initialItem?.bankName ?? "MBBank");
  const [accountNumber, setAccountNumber] = useState(initialItem?.accountNumber ?? "");
  const [accountHolder, setAccountHolder] = useState(initialItem?.accountHolder ?? "");
  const [note, setNote] = useState(initialItem?.note ?? "");
  const [isDefault, setIsDefault] = useState(initialItem?.isDefault ?? false);

  // Cấu hình riêng tư & Webhook SePay trực tiếp theo mã QR
  const [hideAmount, setHideAmount] = useState(initialItem?.hideAmount ?? false);
  const [webhookEnabled, setWebhookEnabled] = useState(initialItem?.webhookEnabled ?? false);
  const [webhookToken, setWebhookToken] = useState<string>(() => {
    if (initialItem?.webhookToken) return initialItem.webhookToken;
    return generateSecureWebhookToken();
  });

  // Cấu hình kiểu dáng QR
  const [foreground, setForeground] = useState(initialItem?.design?.foreground ?? "#000000");
  const [background, setBackground] = useState(initialItem?.design?.background ?? "#ffffff");
  const [margin, setMargin] = useState(initialItem?.design?.margin ?? 2);
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">(
    initialItem?.design?.errorCorrection ?? "M",
  );
  const [logoId, setLogoId] = useState<string | null>(initialItem?.logoId ?? null);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(initialItem?.logoUrl);

  // Ảnh mã QR tùy chỉnh do người dùng tải lên (MoMo, ZaloPay, PayPal, v.v.)
  const [customImageId, setCustomImageId] = useState<string | null>(
    initialItem?.customImageId ?? null,
  );
  const [customImageUrl, setCustomImageUrl] = useState<string | undefined>(
    initialItem?.customImageUrl ??
      (initialItem?.type === "CUSTOM" ? initialItem?.previewSvg : undefined),
  );

  const [previewSvg, setPreviewSvg] = useState<string>(initialItem?.previewSvg ?? "");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Tính toán Webhook URL hoàn chỉnh
  const webhookUrl = useMemo(() => {
    if (!webhookToken) return "";
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://api.toannx.com";
    return `${origin}/api/v1/utilities/donations/webhook/${webhookToken}`;
  }, [webhookToken]);

  const handleCopyWebhookUrl = async () => {
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success(t("webhookCopied"));
    } catch {
      toast.error(t("webhookCopyError"));
    }
  };

  const handleToggleWebhook = (enabled: boolean) => {
    setWebhookEnabled(enabled);
    if (enabled && !webhookToken) {
      setWebhookToken(generateSecureWebhookToken());
    }
  };

  // Tự động điều chỉnh tiêu đề khi đổi loại
  const handleTypeChange = (newType: QrAccountType) => {
    setType(newType);
    if (!initialItem) {
      if (newType === "BANK_TRANSFER") {
        setTitle(bankName || "MBBank");
      } else if (newType === "CUSTOM") {
        setTitle(t("momoFallback"));
      }
    }
  };

  // Chọn ngân hàng
  const handleBankChange = (bin: string) => {
    setBankBin(bin);
    const found = banks.data?.find((b) => b.bin === bin);
    if (found) {
      setBankName(found.shortName);
      if (!initialItem) {
        setTitle(found.shortName);
      }
    }
  };

  // Tự động xem trước mã QR SVG realtime
  useEffect(() => {
    const timer = setTimeout(() => {
      const cleanAcc = accountNumber.trim();
      const validAcc = cleanAcc && /^[0-9A-Za-z]{4,19}$/.test(cleanAcc) ? cleanAcc : "9999999999";
      const validHolder = accountHolder.trim() || "CHU TAI KHOAN";
      const cleanNote = note
        .trim()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/đ/gi, "d")
        .slice(0, 25);

      if (type === "BANK_TRANSFER") {
        const bin = bankBin || "970422";
        const cleanNoteText = cleanNote
          ? cleanNote.toLowerCase().startsWith("donate")
            ? cleanNote
            : `donate ${cleanNote}`
          : "donate";
        const noteParam = encodeURIComponent(cleanNoteText.slice(0, 30));
        const holderParam = encodeURIComponent(validHolder);
        const vietQrUrl = `https://img.vietqr.io/image/${bin}-${validAcc}-compact2.svg?addInfo=${noteParam}&accountName=${holderParam}`;
        setPreviewSvg(vietQrUrl);
        setIsPreviewLoading(false);
        return;
      }

      if (type === "CUSTOM") {
        setPreviewSvg(customImageUrl || "");
        setIsPreviewLoading(false);
        return;
      }

      setIsPreviewLoading(false);
    }, PREVIEW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [
    type,
    bankBin,
    accountNumber,
    accountHolder,
    note,
    foreground,
    background,
    margin,
    errorCorrection,
    logoId,
    customImageUrl,
  ]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (type === "BANK_TRANSFER" && !accountNumber.trim()) return;
    if (type === "CUSTOM" && (!title.trim() || !customImageUrl)) return;

    const savedItem: DonationQrItem = {
      id: initialItem?.id ?? `qr-${Date.now()}`,
      type,
      title: title.trim() || (type === "BANK_TRANSFER" ? bankName : t("qrFallback")),
      bankBin: type === "BANK_TRANSFER" ? bankBin : undefined,
      bankName: type === "BANK_TRANSFER" ? bankName : undefined,
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim().toUpperCase(),
      note: note.trim() || undefined,
      isDefault,
      hideAmount,
      webhookEnabled,
      webhookToken: webhookEnabled ? webhookToken : undefined,
      design:
        type === "BANK_TRANSFER"
          ? {
              foreground,
              background,
              margin,
              size: 512,
              errorCorrection,
            }
          : undefined,
      logoId: type === "BANK_TRANSFER" ? logoId : undefined,
      logoUrl: type === "BANK_TRANSFER" ? logoUrl : undefined,
      previewSvg: type === "CUSTOM" ? customImageUrl : previewSvg || undefined,
      customImageId: type === "CUSTOM" ? customImageId : undefined,
      customImageUrl: type === "CUSTOM" ? customImageUrl : undefined,
    };

    onSave(savedItem);
    onClose();
  };

  return {
    banks: banks.data ?? [],
    isBanksLoading: banks.isPending,
    type,
    handleTypeChange,
    title,
    setTitle,
    bankBin,
    handleBankChange,
    bankName,
    accountNumber,
    setAccountNumber,
    accountHolder,
    setAccountHolder,
    note,
    setNote,
    isDefault,
    setIsDefault,
    hideAmount,
    setHideAmount,
    webhookEnabled,
    handleToggleWebhook,
    webhookToken,
    webhookUrl,
    handleCopyWebhookUrl,
    foreground,
    setForeground,
    background,
    setBackground,
    margin,
    setMargin,
    errorCorrection,
    setErrorCorrection,
    logoId,
    setLogoId,
    logoUrl,
    setLogoUrl,
    customImageId,
    setCustomImageId,
    customImageUrl,
    setCustomImageUrl,
    previewSvg,
    isPreviewLoading,
    handleSubmit,
  };
}
