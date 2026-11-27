"use client";

import { cn } from "cn";
import { type ComponentProps } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/shares/components/ui/avatar";
import { formatUserDisplayName } from "@/shares/lib/user-display";

/**
 * Nguồn dữ liệu người dùng tối thiểu để hiển thị ảnh đại diện, tên hiển thị và chữ cái đại diện.
 */
export type UserAvatarSource =
  | {
      fullName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      username?: string | null;
      email?: string | null;
      avatar?: { url?: string | null } | null;
      avatarUrl?: string | null;
    }
  | null
  | undefined;

/**
 * Lấy tên hiển thị chuẩn hóa của người dùng theo thứ tự:
 * 1. Có cả họ tên (`fullName` hoặc `lastName + firstName`) và `username`: `fullname (username)`
 * 2. Chỉ có họ tên: `fullname`
 * 3. Không có họ tên: `username`
 * 4. Thiếu cả hai: `email`
 *
 * @param user - Thông tin người dùng.
 * @returns Tên hiển thị chuẩn.
 */
export function getUserDisplayName(user: UserAvatarSource): string {
  return formatUserDisplayName(user);
}

/**
 * Lấy ký tự đại diện (initials) chuẩn hóa của người dùng:
 * 1. Nếu có cả họ và tên: lấy chữ cái đầu của họ và tên (VD: "Nguyễn Toàn" -> "NT").
 * 2. Nếu có tên đầy đủ: lấy chữ cái đầu của từ đầu và từ cuối (VD: "Nguyễn Xuân Toàn" -> "NT").
 * 3. Nếu chỉ có tên riêng (firstName): lấy chữ cái đầu.
 * 4. Nếu có tên người dùng (username): lấy chữ cái đầu viết hoa (VD: "toannx" -> "T").
 * 5. Nếu có email: lấy chữ cái đầu của phần trước dấu @ (VD: "nxtoan2k4@..." -> "N").
 * 6. Mặc định: "?".
 *
 * @param user - Thông tin người dùng.
 * @returns Ký tự viết tắt đại diện viết hoa.
 */
export function getUserInitials(user: UserAvatarSource): string {
  if (!user) return "?";

  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  if (first && last) {
    return (last.charAt(0) + first.charAt(0)).toUpperCase();
  }
  if (first) {
    return first.charAt(0).toUpperCase();
  }

  const fullName = user.fullName?.trim();
  if (fullName) {
    const words = fullName.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
  }

  const username = user.username?.trim();
  if (username) {
    return username.charAt(0).toUpperCase();
  }

  const email = user.email?.trim();
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) {
      return local.charAt(0).toUpperCase();
    }
  }

  return "?";
}

/**
 * Thuộc tính của component UserAvatar.
 */
export type UserAvatarProps = Omit<ComponentProps<typeof Avatar>, "children"> & {
  user?: UserAvatarSource;
  alt?: string;
  fallbackClassName?: string;
};

/**
 * Avatar người dùng dùng chung: chuẩn hóa hiển thị ảnh đại diện và chữ cái viết tắt đại diện,
 * đồng bộ trải nghiệm xuyên suốt toàn bộ hệ thống (tránh lệch chữ cái giữa trang chủ, header và menu).
 *
 * @param props - Thông tin người dùng, kích cỡ và lớp CSS tùy biến.
 * @returns Component Avatar người dùng chuẩn.
 */
export function UserAvatar({
  user,
  alt,
  className,
  fallbackClassName,
  size = "default",
  ...props
}: UserAvatarProps) {
  const imageUrl = user?.avatar?.url ?? user?.avatarUrl;
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  return (
    <Avatar
      size={size}
      className={cn("ring-border/70 border-background border shadow-2xs ring-2", className)}
      data-slot="user-avatar"
      {...props}
    >
      {imageUrl ? <AvatarImage src={imageUrl} alt={alt || displayName || ""} /> : null}
      <AvatarFallback
        className={cn(
          "bg-primary-light text-primary font-medium select-none",
          size === "sm" && "text-[10px]",
          size === "default" && "text-xs",
          size === "lg" && "text-sm",
          fallbackClassName,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
