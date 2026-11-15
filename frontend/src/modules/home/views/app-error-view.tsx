"use client";

import { ErrorState } from "@/shares/components/errors/error-state";

import { useReportClientError } from "../hooks/use-report-client-error";

/**
 * Màn lỗi của error boundary theo ngôn ngữ: thông báo thân thiện, không lộ chi tiết kỹ thuật, báo lỗi về BE.
 *
 * @param props - Lỗi và hàm thử lại do Next.js cung cấp.
 * @returns Giao diện lỗi.
 */
export function AppErrorView({ error, retry }: { error: unknown; retry: () => void }) {
  useReportClientError(error);
  return (
    <main className="mx-auto max-w-md px-4 pt-24">
      <ErrorState onRetry={retry} />
    </main>
  );
}
