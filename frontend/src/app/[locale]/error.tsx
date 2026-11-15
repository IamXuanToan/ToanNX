"use client";

import { AppErrorView } from "@/modules/home/views/app-error-view";

/**
 * Error boundary theo ngôn ngữ.
 *
 * @param props - Lỗi và hàm thử lại do Next.js cung cấp.
 * @returns AppErrorView.
 */
export default function LocaleError({ error, retry }: { error: unknown; retry: () => void }) {
  return <AppErrorView error={error} retry={retry} />;
}
