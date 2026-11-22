import { cn } from "cn";
import { useTranslations } from "next-intl";

import { Skeleton } from "@/shares/components/ui/skeleton";

/**
 * Khung chờ chung cho khối nội dung chưa có hình chờ riêng (form, panel): các thanh cao 40px.
 * Bảng dùng khung chờ của `DataTable`, không dùng component này.
 *
 * @param props - Số thanh và class thêm.
 * @returns Khung chờ.
 */
export function LoadingState({ rows = 5, className }: { rows?: number; className?: string }) {
  const t = useTranslations("common.loadingState");
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-label={t("label")}>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-10 w-full rounded-xl" />
      ))}
    </div>
  );
}
