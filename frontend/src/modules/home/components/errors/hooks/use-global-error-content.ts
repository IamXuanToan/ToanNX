"use client";

import { useReportClientError } from "../../../hooks/use-report-client-error";

/**
 * Logic màn lỗi gốc: báo lỗi lên backend, nhận ngôn ngữ từ URL (không có provider next-intl), lấy mã digest.
 *
 * @param error - Lỗi do Next.js global error boundary cung cấp.
 * @returns Ngôn ngữ (`vi`/`en`) và mã digest (nếu có).
 */
export function useGlobalErrorContent(error: unknown) {
  useReportClientError(error);

  const isEn = typeof window !== "undefined" && window.location.pathname.startsWith("/en");
  const locale: "vi" | "en" = isEn ? "en" : "vi";

  const digest =
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string"
      ? (error as { digest: string }).digest
      : null;

  return { locale, digest };
}
