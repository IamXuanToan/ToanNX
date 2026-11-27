"use client";

import type { ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shares/components/ui/tooltip";

/**
 * Tooltip chuẩn shadcn dùng chung cho toàn hệ thống thay cho thuộc tính HTML `title=` gốc của trình duyệt.
 * Tự bọc `TooltipProvider` để hoạt động ổn định cả khi component được render độc lập trong test.
 *
 * @param props - Nội dung tooltip, phần tử kích hoạt và vị trí hiển thị.
 * @returns Phần tử được bọc Tooltip chuẩn shadcn.
 */
export function AppTooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 150,
  disabled = false,
  className,
}: {
  content?: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  disabled?: boolean;
  className?: string;
}) {
  if (disabled || content === undefined || content === null || content === "") {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} align={align} className={className}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
