"use client";

import type { ReactNode } from "react";

import { cn } from "cn";

/**
 * Bong bóng nội dung của một tin nhắn (`user`, `assistant`, hoặc `error`).
 *
 * @param props - Vai trò hiển thị, cờ lỗi và nội dung bên trong.
 * @returns Bong bóng văn bản giữ xuống dòng, ngắt chữ an toàn trên Light/Dark mode.
 */
export function MessageContent({
  role,
  isError = false,
  children,
  className,
}: {
  role: "user" | "assistant" | "system";
  isError?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const isUser = role === "user";
  return (
    <div
      data-slot="message-content"
      className={cn(
        "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap shadow-2xs",
        isUser
          ? "bg-primary text-primary-foreground rounded-br-xs"
          : isError
            ? "border-destructive/40 bg-destructive/10 text-destructive rounded-bl-xs border"
            : "border-border/60 bg-muted/70 text-foreground rounded-bl-xs border",
        className,
      )}
    >
      {children}
    </div>
  );
}
