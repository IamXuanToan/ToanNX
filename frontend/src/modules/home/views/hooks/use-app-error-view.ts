"use client";

import { useState } from "react";

import { useReportClientError } from "../../hooks/use-report-client-error";

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
export function useAppErrorView(error: unknown) {
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

  const errorMessage =
    process.env.NODE_ENV === "development" && error instanceof Error ? error.message : null;

  const handleCopy = () => {
    if (!digest) return;
    void navigator.clipboard.writeText(digest);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return {
    digest,
    errorMessage,
    copied,
    handleCopy,
  };
}
