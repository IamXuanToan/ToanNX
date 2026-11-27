"use client";

import { Bot } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/shares/components/ui/avatar";
import { cn } from "cn";

/**
 * Ảnh đại diện Trợ lý AI: ưu tiên ảnh công khai do chủ sở hữu cấu hình (`avatarUrl`),
 * tự lùi về biểu tượng Bot chuẩn trên nền màu nhấn khi chưa chọn ảnh.
 *
 * @param props - Đường dẫn ảnh, tên hiển thị, kích cỡ và class bổ sung.
 * @returns Avatar Trợ lý AI.
 */
export function AssistantAvatar({
  avatarUrl,
  name,
  size = "default",
  className,
  iconClassName,
}: {
  avatarUrl?: string | null;
  name?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
  iconClassName?: string;
}) {
  return (
    <Avatar
      size={size}
      className={cn("border-border/70 bg-primary/10 border shadow-2xs", className)}
      data-slot="assistant-avatar"
    >
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name || "AI"} /> : null}
      <AvatarFallback className="bg-primary/10 text-primary">
        <Bot
          className={cn(
            size === "sm" && "size-3.5",
            size === "default" && "size-4",
            size === "lg" && "size-7",
            iconClassName,
          )}
          aria-hidden
        />
      </AvatarFallback>
    </Avatar>
  );
}
