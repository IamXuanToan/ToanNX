"use client";

import type { ReactNode } from "react";

import { cn } from "cn";

/**
 * Hàng nhãn phụ bên dưới bong bóng tin nhắn (giờ gửi, model, số token, dữ liệu riêng tư).
 *
 * @param props - Các nhãn/badge và căn lề trái/phải.
 * @returns Khối siêu dữ liệu gọn nhẹ.
 */
export function MessageMeta({
  align = "start",
  children,
  className,
}: {
  align?: "start" | "end";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="message-meta"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-[11px]",
        align === "end" ? "justify-end" : "justify-start",
        className,
      )}
    >
      {children}
    </div>
  );
}
