"use client";

import { ArrowDown } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/shares/components/ui/button";
import { cn } from "cn";

import { useMessageScroller } from "./hooks/use-message-scroller";

/**
 * Khung cuộn danh sách tin nhắn chuẩn shadcn: tự dính đáy khi có tin mới
 * và hiển thị nút tròn cuộn xuống dưới khi người dùng cuộn lên xem tin cũ.
 *
 * @param props - Danh sách tin nhắn, khóa theo dõi thay đổi & nhãn nút cuộn xuống đáy.
 * @returns Vùng cuộn tin nhắn kèm nút nhảy xuống cuối.
 */
export function MessageScroller({
  watchValue,
  scrollToBottomLabel,
  children,
  className,
}: {
  watchValue: unknown;
  scrollToBottomLabel: string;
  children: ReactNode;
  className?: string;
}) {
  const { viewportRef, showScrollButton, onScroll, scrollToBottom } =
    useMessageScroller(watchValue);

  return (
    <div data-slot="message-scroller" className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={viewportRef}
        onScroll={onScroll}
        className={cn("min-h-0 flex-1 overflow-y-auto", className)}
      >
        {children}
      </div>

      {showScrollButton ? (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={() => scrollToBottom("smooth")}
          aria-label={scrollToBottomLabel}
          title={scrollToBottomLabel}
          data-testid="message-scroller-bottom-btn"
          className="border-border/80 absolute right-3 bottom-3 size-8 rounded-full border shadow-md"
        >
          <ArrowDown className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
