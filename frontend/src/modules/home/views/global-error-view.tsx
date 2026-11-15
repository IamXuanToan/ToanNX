"use client";

import { useReportClientError } from "../hooks/use-report-client-error";

/**
 * Màn lỗi khi chính layout gốc hỏng: tự dựng `<html>`/`<body>`, không có provider đa ngôn ngữ nên ghi song
 * ngữ, giao diện theo chế độ sáng/tối của hệ điều hành. Báo lỗi về BE.
 *
 * @param props - Lỗi và hàm thử lại do Next.js cung cấp.
 * @returns Tài liệu HTML của trang lỗi.
 */
export function GlobalErrorView({ error, retry }: { error: unknown; retry: () => void }) {
  useReportClientError(error);
  return (
    <html lang="vi">
      <body className="bg-background text-foreground min-h-dvh antialiased">
        <title>Lỗi · Error</title>
        <main className="mx-auto max-w-md px-4 pt-24 text-center">
          <h1 className="text-lg font-semibold">Đã xảy ra lỗi</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="border-input bg-card hover:bg-muted mt-6 h-10 rounded-xl border px-4 text-sm font-medium"
          >
            Thử lại · Try again
          </button>
        </main>
      </body>
    </html>
  );
}
