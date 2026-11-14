import { ShieldX } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * Màn hình không có quyền truy cập (403).
 *
 * @param props - Hành động bổ sung (ví dụ nút đăng xuất).
 * @returns Giao diện 403.
 */
export function ForbiddenView({ action }: { action?: ReactNode }) {
  const t = useTranslations("errors.forbidden");
  return (
    <div
      className="flex min-h-[60svh] flex-col items-center justify-center gap-4 px-4 text-center"
      data-testid="forbidden"
    >
      <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-2xl">
        <ShieldX className="size-7" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground max-w-md text-sm">{t("description")}</p>
      </div>
      {action}
    </div>
  );
}
