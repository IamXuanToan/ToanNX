"use client";

import { GlobalErrorContent } from "../../components/errors/global-error-content";

/**
 * Màn lỗi khi chính layout gốc hỏng (tự dựng `<html>`/`<body>`).
 *
 * @param props - Lỗi và hàm thử lại do Next.js cung cấp.
 * @returns Tài liệu HTML hoàn chỉnh của trang lỗi toàn cục.
 */
export function GlobalErrorView({ error, retry }: { error: unknown; retry: () => void }) {
  return <GlobalErrorContent error={error} retry={retry} />;
}
