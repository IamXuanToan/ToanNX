"use client";

import { ErrorState } from "@/shares/components/errors/error-state";

/**
 * Error boundary theo ngôn ngữ: hiển thị lỗi thân thiện, không lộ chi tiết kỹ thuật.
 *
 * @param props - Hàm thử lại do Next.js cung cấp.
 * @returns Giao diện lỗi.
 */
export default function LocaleError({ retry }: { error: Error; retry: () => void }) {
  return (
    <main className="mx-auto max-w-md px-4 pt-24">
      <ErrorState onRetry={retry} />
    </main>
  );
}
