"use client";

import "./globals.css";

import { GlobalErrorView } from "@/modules/home/views/errors/global-error-view";

/**
 * Error boundary của layout gốc (thay toàn bộ tài liệu khi kích hoạt).
 *
 * @param props - Lỗi và hàm thử lại do Next.js cung cấp.
 * @returns GlobalErrorView.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  return <GlobalErrorView error={error} retry={retry} />;
}
