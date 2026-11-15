import { Link2Off } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EmptyState } from "@/shares/components/common/empty-state/empty-state";

const REASONS = ["not-found", "expired", "busy"] as const;

/**
 * Thông báo khi link rút gọn không chuyển hướng được (đã tắt/xóa, hết hạn, quá nhiều lượt).
 *
 * @param props - Lý do (`?reason=`) và lối ra (page ghép, ví dụ về trang chủ).
 * @returns Trang thông báo.
 */
export function LinkUnavailableView({ reason, action }: { reason?: string; action?: ReactNode }) {
  const t = useTranslations("shortLinks.unavailable");
  const key = REASONS.find((item) => item === reason) ?? "not-found";
  return (
    <main className="mx-auto flex min-h-[70svh] max-w-lg items-center px-4">
      <EmptyState
        icon={<Link2Off />}
        title={t(`${key}.title`)}
        description={t(`${key}.description`)}
        action={action}
      />
    </main>
  );
}
