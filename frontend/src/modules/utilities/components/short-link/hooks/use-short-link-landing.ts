"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";

import { isApiError } from "@/shares/lib/api/api-error";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";

import { usePublicShortLink } from "../../../hooks/use-public-short-link";
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
 * Tự động gọi API phía client nếu chưa có `initialLink` (hỗ trợ debug trực tiếp trên tab Network).
 *
 * @param slug - Mã slug của short link.
 * @param initialLink - Dữ liệu link ban đầu nếu có (chế độ xem trước).
 * @param preview - Cờ đang ở chế độ xem trước (không chuyển hướng thật).
 * @returns Toàn bộ dữ liệu tính toán và các hàm điều khiển hành vi cho card.
 */
export function useShortLinkLanding(
  slug: string,
  initialLink?: PublicShortLink | null,
  preview = false,
) {
  const t = useTranslations("utilities.shortLinks.landing");
  const passwordId = useId();

  const query = usePublicShortLink(slug, !initialLink);
  const link = initialLink ?? query.data ?? null;
  const isLoading = !initialLink && query.isLoading;

  const [password, setPassword] = useState("");
  const [unlockedDestination, setUnlockedDestination] = useState<string | null>(null);
  const rawDestination =
    unlockedDestination ?? (link?.hasPassword ? null : (link?.destinationUrl ?? null));
  const destination = toSafeHttpUrl(rawDestination, { allowRelative: false });

  const [customRemaining, setCustomRemaining] = useState<number | null>(null);
  const remaining = customRemaining ?? link?.autoRedirectSeconds ?? null;

  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!destination || preview || remaining === null || remaining <= 0) return;
    const timer = window.setTimeout(
      () => setCustomRemaining((value) => (value ?? link?.autoRedirectSeconds ?? 1) - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [destination, preview, remaining, link?.autoRedirectSeconds]);

  useEffect(() => {
    if (destination && !preview && remaining === 0) window.location.assign(destination);
  }, [destination, preview, remaining]);

  async function unlock() {
    if (!link) return;
    setIsUnlocking(true);
    setErrorCode(null);
    try {
      const url = preview ? link.destinationUrl : await shortLinkService.unlock(slug, password);
      setUnlockedDestination(url);
      setCustomRemaining(link.autoRedirectSeconds);
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

  const queryStatus = isApiError(query.error) ? query.error.status : 0;
  const queryUnavailable = query.isError
    ? queryStatus === 410
      ? "expired"
      : queryStatus === 429
        ? "busy"
        : "not-found"
    : null;

  const unavailable =
    queryUnavailable ??
    (errorCode === "UTILITIES_SHORT_LINK_EXPIRED"
      ? "expired"
      : errorCode === "RATE_LIMITED"
        ? "busy"
        : null);

  const destinationDomain = extractDomain(destination);
  const totalSeconds = link?.autoRedirectSeconds ?? 5;
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
    isLoading,
    link,
    unlock,
    proceed,
    copyDestination,
  };
}
