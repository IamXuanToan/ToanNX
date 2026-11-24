"use client";

import { useState } from "react";

import { useReportClientError } from "../../../hooks/use-report-client-error";

/**
 * Hook quản lý logic màn hình lỗi máy chủ/thời gian chạy (500 Error Boundary):
 * - Báo cáo lỗi lên backend qua `useReportClientError`.
 * - Trích xuất mã digest lỗi từ Next.js error boundary.
 * - Trích xuất error message trong môi trường development.
 * - Quản lý clipboard copy mã digest kèm timeout 2s.
 *
 * @param error - Đối tượng lỗi từ Error Boundary.
 * @returns Mã digest, error message, cờ copied và hàm handleCopy.
 */
export function useAppErrorContent(error: unknown) {
  useReportClientError(error);

  const [copied, setCopied] = useState(false);

  // Next.js error digest (mã định danh sự cố duy nhất sinh bởi Next.js)
  const digest =
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string"
      ? (error as { digest: string }).digest
      : null;

  const errorName = error instanceof Error ? error.name : "Error";
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Đã xảy ra sự cố không mong muốn.";
  const errorStack = error instanceof Error ? (error.stack ?? null) : null;
  const isDev = process.env.NODE_ENV === "development";

  const handleCopy = () => {
    const fullDetails = [
      `[URL]: ${typeof window !== "undefined" ? window.location.href : "N/A"}`,
      digest ? `[Digest]: ${digest}` : "",
      `[Error]: ${errorName}: ${errorMessage}`,
      errorStack ? `[Stack Trace]:\n${errorStack}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    void navigator.clipboard.writeText(fullDetails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return {
    digest,
    errorName,
    errorMessage,
    errorStack,
    isDev,
    copied,
    handleCopy,
  };
}
