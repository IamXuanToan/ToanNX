"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";

import { isApiError } from "@/shares/lib/api/api-error";

import { shortLinkService } from "../../../services/short-link.service";
import type { PublicShortLink } from "../../../types/short-link.types";

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
 * Quản lý toàn bộ nghiệp vụ, trạng thái mở khóa, đếm ngược, sao chép URL và lỗi trên trang trung gian ShortLink.
 *
 * @param slug - Mã slug của short link.
 * @param link - Thông tin công khai của link.
 * @param preview - Cờ đang ở chế độ xem trước (không chuyển hướng thật).
 * @returns Toàn bộ dữ liệu tính toán và các hàm điều khiển hành vi cho card.
 */
export function useShortLinkLanding(slug: string, link: PublicShortLink, preview: boolean) {
  const t = useTranslations("utilities.shortLinks.landing");
  const passwordId = useId();

  const [password, setPassword] = useState("");
  const [destination, setDestination] = useState<string | null>(
    link.hasPassword ? null : link.destinationUrl,
  );
  const [remaining, setRemaining] = useState(link.autoRedirectSeconds);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!destination || preview || remaining === null || remaining <= 0) return;
    const timer = window.setTimeout(
      () => setRemaining((value) => (value === null ? null : value - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [destination, preview, remaining]);

  useEffect(() => {
    if (destination && !preview && remaining === 0) window.location.assign(destination);
  }, [destination, preview, remaining]);

  async function unlock() {
    setIsUnlocking(true);
    setErrorCode(null);
    try {
      const url = preview ? link.destinationUrl : await shortLinkService.unlock(slug, password);
      setDestination(url);
      setRemaining(link.autoRedirectSeconds);
      setPassword("");
    } catch (error) {
      setErrorCode(isApiError(error) ? error.code : "UNKNOWN");
    } finally {
      setIsUnlocking(false);
    }
  }

  function proceed() {
    if (destination && !preview) window.location.assign(destination);
  }

  async function copyDestination() {
    if (!destination) return;
    try {
      await navigator.clipboard.writeText(destination);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Bỏ qua lỗi clipboard nếu trình duyệt chặn quyền
    }
  }

  const error =
    errorCode === "UTILITIES_SHORT_LINK_INVALID_PASSWORD"
      ? t("invalidPassword")
      : errorCode
        ? t("unlockError")
        : null;

  const unavailable =
    errorCode === "UTILITIES_SHORT_LINK_EXPIRED"
      ? "expired"
      : errorCode === "RATE_LIMITED"
        ? "busy"
        : null;

  const destinationDomain = extractDomain(destination);
  const totalSeconds = link.autoRedirectSeconds ?? 5;
  const progressPercent =
    remaining !== null && totalSeconds > 0
      ? Math.max(0, Math.min(100, (remaining / totalSeconds) * 100))
      : 0;

  return {
    passwordId,
    password,
    setPassword,
    destination,
    totalSeconds,
    remaining,
    isUnlocking,
    errorCode,
    copied,
    error,
    unavailable,
    destinationDomain,
    progressPercent,
    unlock,
    proceed,
    copyDestination,
  };
}
