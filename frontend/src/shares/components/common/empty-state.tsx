import { cn } from "cn";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { LogoMark } from "@/shares/components/layout/logo-mark";

/**
 * Trạng thái không có dữ liệu chuẩn (bảng rỗng, lọc ra 0 kết quả, danh mục rỗng).
 * Khối cao tối thiểu 320px để card không xẹp khi dữ liệu về; icon nằm trong hai vòng nền nhạt,
 * tiêu đề + mô tả ngắn, một hành động (lối ra: xoá tìm kiếm/xoá lọc, hoặc tạo mới).
 *
 * @param props - Tiêu đề, mô tả, icon, hành động và class thêm (ví dụ chiều cao khác).
 * @returns Khối empty state.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const t = useTranslations("common.emptyState");
  return (
    <div
      className={cn(
        "flex min-h-80 flex-col items-center justify-center gap-5 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="bg-muted/60 flex size-20 items-center justify-center rounded-full">
        <div className="bg-card text-muted-foreground flex size-12 items-center justify-center rounded-full border [&_svg:not([class*='size-'])]:size-5">
          {icon ?? <LogoMark className="size-6 opacity-60 grayscale" />}
        </div>
      </div>
      <div className="max-w-sm space-y-1.5">
        <p className="text-base font-semibold text-balance">{title ?? t("title")}</p>
        {description ? (
          <p className="text-muted-foreground text-sm text-pretty">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
