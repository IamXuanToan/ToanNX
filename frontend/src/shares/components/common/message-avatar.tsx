"use client";

import type { ReactNode } from "react";

import { cn } from "cn";

/**
 * Khung chứa ảnh đại diện cạnh mỗi tin nhắn trong `Message`.
 *
 * @param props - Nội dung avatar (icon, `<Avatar />`, hoặc `<UserAvatar />`) và class bổ sung.
 * @returns Vỏ bọc avatar kích thước đồng nhất.
 */
export function MessageAvatar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="message-avatar"
      className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", className)}
    >
      {children}
    </div>
  );
}
