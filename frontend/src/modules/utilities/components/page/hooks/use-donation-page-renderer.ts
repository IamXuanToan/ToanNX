"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { DonationQrItem } from "../../../types/page.types";

/**
 * Hook quản lý sao chép số tài khoản, chọn phương thức thanh toán và chọn/nhập số tiền ủng hộ trên trang Donation.
 *
 * @param qrCodes - Danh sách các phương thức / mã QR nhận tiền.
 * @param fallbackAccountNumber - Số tài khoản dự phòng khi chưa cấu hình danh sách qrCodes.
 * @param minAmount - Số tiền ủng hộ tối thiểu (mặc định 10.000 ₫).
 * @param displayMode - Chế độ hiển thị: "single" (chỉ 1 mã chính mặc định) hoặc "multiple" (nhiều mã).
 * @returns Trạng thái activeQr, copied, số tiền chọn, input số tiền tùy ý và các hàm xử lý.
 */
export function useDonationPageRenderer(
  qrCodes: DonationQrItem[] = [],
  fallbackAccountNumber: string = "",
  minAmount: number = 10000,
  displayMode: string = "multiple",
) {
  const t = useTranslations("utilities.customPages.donation");

  const [selectedQrId, setSelectedQrId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmountText, setCustomAmountText] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [isNoteManuallyEdited, setIsNoteManuallyEdited] = useState(false);

  // Tìm mã mặc định, fallback về mã đầu tiên
  const defaultQr = useMemo(() => qrCodes.find((q) => q.isDefault) ?? qrCodes[0], [qrCodes]);

  // Khi ở chế độ single, luôn ưu tiên hiển thị mã mặc định
  const activeQr = useMemo(() => {
    if (displayMode === "single") {
      return defaultQr;
    }
    if (selectedQrId) {
      return qrCodes.find((q) => q.id === selectedQrId) ?? defaultQr;
    }
    return defaultQr;
  }, [displayMode, selectedQrId, qrCodes, defaultQr]);

  const activeQrId = activeQr?.id ?? "";
  const creatorNote = activeQr?.note;

  // Tính toán nội dung chuyển khoản bắt buộc có tiền tố donate
  const transferNote = useMemo(() => {
    const cleanUserNote = customNote.trim();
    if (cleanUserNote) {
      return cleanUserNote.toLowerCase().startsWith("donate")
        ? cleanUserNote
        : `donate ${cleanUserNote}`;
    }
    if (creatorNote) {
      const cleanCreatorNote = creatorNote.trim();
      return cleanCreatorNote.toLowerCase().startsWith("donate")
        ? cleanCreatorNote
        : `donate ${cleanCreatorNote}`;
    }
    return "donate";
  }, [customNote, creatorNote]);

  // Chuẩn hóa nội dung cho VietQR (NAPAS 247 không dấu, tối đa 30 ký tự)
  const vietQrNote = useMemo(() => {
    return transferNote
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/đ/gi, "d")
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 30);
  }, [transferNote]);

  const currentAccountNumber = activeQr?.accountNumber || fallbackAccountNumber;

  const handleCopyAccount = async () => {
    if (!currentAccountNumber) return;
    try {
      await navigator.clipboard.writeText(currentAccountNumber);
      setCopied(true);
      toast.success(t("copySuccess"));
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(t("copyError"));
    }
  };

  const handleCopyNote = async () => {
    if (!transferNote) return;
    try {
      await navigator.clipboard.writeText(transferNote);
      setCopiedNote(true);
      toast.success(t("copyNoteSuccess"));
      setTimeout(() => setCopiedNote(false), 2500);
    } catch {
      toast.error(t("copyError"));
    }
  };

  const handleSelectPresetAmount = (amount: number, presetTitle?: string | null) => {
    if (selectedAmount === amount) {
      setSelectedAmount(null);
      setCustomAmountText("");
      if (!isNoteManuallyEdited) {
        setCustomNote("");
      }
    } else {
      setSelectedAmount(amount);
      setCustomAmountText(amount.toLocaleString("vi-VN"));
      if (!isNoteManuallyEdited) {
        setCustomNote(presetTitle ?? "");
      }
    }
  };

  const handleCustomAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      setCustomAmountText("");
      setSelectedAmount(null);
      return;
    }
    const num = Number(digits);
    setCustomAmountText(num.toLocaleString("vi-VN"));
    if (num >= minAmount) {
      setSelectedAmount(num);
    } else {
      setSelectedAmount(null);
    }
  };

  const handleClearAmount = () => {
    setSelectedAmount(null);
    setCustomAmountText("");
  };

  const handleCustomNoteChange = (text: string) => {
    setCustomNote(text);
    if (!text.trim()) {
      setIsNoteManuallyEdited(false);
    } else {
      setIsNoteManuallyEdited(true);
    }
  };

  const isBelowMin =
    customAmountText.length > 0 &&
    Number(customAmountText.replace(/\D/g, "")) > 0 &&
    Number(customAmountText.replace(/\D/g, "")) < minAmount;

  return {
    activeQrId,
    setActiveQrId: setSelectedQrId,
    activeQr,
    currentAccountNumber,
    copied,
    copiedNote,
    selectedAmount,
    customAmountText,
    customNote,
    isNoteManuallyEdited,
    transferNote,
    vietQrNote,
    isBelowMin,
    handleSelectPresetAmount,
    handleCustomAmountChange,
    handleClearAmount,
    handleCustomNoteChange,
    handleCopyAccount,
    handleCopyNote,
  };
}
