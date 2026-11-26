"use client";

import { Bot } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/shares/components/ui/avatar";

/**
 * Hiển thị trạng thái `{name} đang suy nghĩ` với 3 chấm chuyển động nhẹ nhàng (tôn trọng `motion-reduce`).
 *
 * @param props - Tên hiển thị, ảnh đại diện bot (tuỳ chọn) và câu thông báo đã dịch.
 * @returns Bong bóng trạng thái đang suy nghĩ của Trợ lý AI.
 */
export function AssistantThinkingIndicator({
  name,
  avatarUrl,
  label,
}: {
  name: string;
  avatarUrl?: string | null;
  label: string;
}) {
  return (
    <div
      data-testid="assistant-thinking-indicator"
      aria-live="polite"
      className="flex items-start gap-2.5"
    >
      <Avatar className="border-primary/25 size-7 shrink-0 border shadow-xs">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          <Bot className="size-3.5 animate-pulse motion-reduce:animate-none" aria-hidden />
        </AvatarFallback>
      </Avatar>

      <div className="bg-muted/80 text-foreground border-border/60 inline-flex items-center gap-2.5 rounded-2xl rounded-tl-xs border px-3.5 py-2 text-xs shadow-xs">
        <span className="font-medium">{label}</span>
        <span className="inline-flex items-center gap-1" aria-hidden>
          <span className="bg-primary size-1.5 animate-bounce rounded-full [animation-delay:0ms] motion-reduce:animate-none" />
          <span className="bg-primary size-1.5 animate-bounce rounded-full [animation-delay:150ms] motion-reduce:animate-none" />
          <span className="bg-primary size-1.5 animate-bounce rounded-full [animation-delay:300ms] motion-reduce:animate-none" />
        </span>
      </div>
    </div>
  );
}
