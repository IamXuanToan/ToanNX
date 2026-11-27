"use client";

import type { ReactNode } from "react";

import { cn } from "cn";

export type MessageRole = "user" | "assistant" | "system";

/**
 * Khung một lượt tin nhắn chuẩn shadcn cho luồng hội thoại Chatbot AI.
 *
 * @param props - Vai trò người gửi, avatar, siêu dữ liệu và nội dung bong bóng tin nhắn.
 * @returns Dòng tin nhắn căn trái (Trợ lý) hoặc căn phải (Người dùng).
 */
export function Message({
  role,
  avatar,
  meta,
  children,
  className,
}: {
  role: MessageRole;
  avatar?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const isUser = role === "user";
  return (
    <div
      data-slot="message"
      data-role={role}
      className={cn("flex items-end gap-2.5", isUser ? "justify-end" : "justify-start", className)}
    >
      {!isUser && avatar ? <div className="shrink-0">{avatar}</div> : null}
      <div
        className={cn(
          "flex max-w-[82%] min-w-0 flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        {children}
        {meta}
      </div>
      {isUser && avatar ? <div className="shrink-0">{avatar}</div> : null}
    </div>
  );
}
