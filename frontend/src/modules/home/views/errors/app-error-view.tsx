"use client";

import { AppErrorContent } from "../../components/errors/app-error-content";

/**
 * Màn hình lỗi máy chủ / lỗi thời gian chạy của Error Boundary (500 Server Error).
 *
 * @param props - Lỗi và hàm thử lại do Next.js error boundary cung cấp.
 * @returns Nội dung trang lỗi 500.
 */
export function AppErrorView({ error, retry }: { error: unknown; retry: () => void }) {
  return <AppErrorContent error={error} retry={retry} />;
}
