"use client";

import { cn } from "cn";
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/shares/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shares/components/ui/tooltip";

/**
 * Biểu tượng dấu chấm than kèm Tooltip hướng dẫn cạnh các ô nhập (VD: "Gõ rồi nhấn Enter").
 * Tự bọc `TooltipProvider` để hoạt động ổn định kể cả khi nhúng ngoài shell hoặc trong test lẻ.
 *
 * @param props - Nội dung hướng dẫn, nhãn accessibility và vị trí hiển thị.
 * @returns Nút biểu tượng kèm tooltip.
 */
export function InlineHelpTooltip({
  content,
  label,
  side = "top",
  className,
}: {
  content: ReactNode;
  label: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            className={cn(
              "text-muted-foreground hover:text-foreground size-6 shrink-0 cursor-help rounded-full hover:bg-transparent",
              className,
            )}
          >
            <AlertCircle className="size-3.5" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-64 text-pretty">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
