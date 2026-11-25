"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "cn";
import {
  Camera,
  FolderGit2,
  Globe,
  Mail,
  MessageCircle,
  Music,
  Send,
  Share2,
  ShoppingBag,
  Video,
} from "lucide-react";

/**
 * Chuẩn hóa và trích xuất domain từ một URL bất kỳ (loại bỏ www, cổng và query).
 *
 * @param url - Chuỗi URL cần xử lý.
 * @returns Domain chữ thường sạch (ví dụ: facebook.com, youtube.com).
 */
export function extractCleanDomain(url?: string | null): string {
  if (!url) return "";
  try {
    const raw = url.trim();
    const hasProtocol = /^https?:\/\//i.test(raw);
    const parsed = new URL(hasProtocol ? raw : `https://${raw}`);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Nhận diện loại liên kết và chọn icon vector cùng màu nền phù hợp theo nền tảng xã hội.
 *
 * @param url - URL liên kết.
 * @param title - Tiêu đề liên kết.
 * @returns Thông tin icon, class màu chữ và class màu nền.
 */
export function getLinkPlatformIcon(url: string, title: string) {
  const target = `${url} ${title}`.toLowerCase();

  if (target.includes("youtube.com") || target.includes("youtu.be")) {
    return { icon: Video, color: "text-red-500", bg: "bg-red-500/10" };
  }
  if (target.includes("tiktok.com")) {
    return {
      icon: Music,
      color: "text-neutral-900 dark:text-neutral-100",
      bg: "bg-neutral-500/10",
    };
  }
  if (target.includes("instagram.com")) {
    return { icon: Camera, color: "text-pink-500", bg: "bg-pink-500/10" };
  }
  if (target.includes("facebook.com") || target.includes("fb.me")) {
    return { icon: Share2, color: "text-blue-600", bg: "bg-blue-500/10" };
  }
  if (target.includes("github.com")) {
    return {
      icon: FolderGit2,
      color: "text-neutral-800 dark:text-neutral-200",
      bg: "bg-neutral-500/10",
    };
  }
  if (target.includes("t.me") || target.includes("telegram")) {
    return { icon: Send, color: "text-sky-500", bg: "bg-sky-500/10" };
  }
  if (target.includes("zalo") || target.includes("chat")) {
    return { icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-500/10" };
  }
  if (
    target.includes("shopee") ||
    target.includes("lazada") ||
    target.includes("store") ||
    target.includes("shop")
  ) {
    return { icon: ShoppingBag, color: "text-orange-500", bg: "bg-orange-500/10" };
  }
  if (target.includes("mailto:") || target.includes("@")) {
    return { icon: Mail, color: "text-emerald-500", bg: "bg-emerald-500/10" };
  }

  return { icon: Globe, color: "text-primary", bg: "bg-primary/10" };
}

export interface BioLinkIconProps {
  /** Đường dẫn đích của liên kết. */
  url?: string;
  /** Tiêu đề của liên kết (dùng cho alt và gợi ý nền tảng). */
  title?: string;
  /** URL ảnh icon tùy chỉnh người dùng dán hoặc tải lên. */
  iconUrl?: string | null;
  /** Kích thước px hiển thị của icon (mặc định 24). */
  size?: number;
  /** Class bổ sung cho thẻ ảnh. */
  className?: string;
  /** Class bổ sung cho icon vector dự phòng. */
  fallbackClassName?: string;
}

/**
 * Biểu tượng cho liên kết nổi bật & mạng xã hội trong trang cá nhân (Bio):
 * Hỗ trợ 3 tầng hiển thị mượt mà:
 * 1. URL icon tùy chỉnh do người dùng chỉ định.
 * 2. Tự động lấy Google Favicon V2 API từ domain của liên kết (như short link).
 * 3. Fallback về Vector Icon Lucide chuẩn của nền tảng nếu ảnh không tải được.
 */
export function BioLinkIcon({
  url = "",
  title = "",
  iconUrl,
  size = 24,
  className,
  fallbackClassName,
}: BioLinkIconProps) {
  const [customError, setCustomError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const cleanDomain = extractCleanDomain(url);
  const platform = getLinkPlatformIcon(url, title);
  const PlatformIcon = platform.icon;

  // 1. Người dùng chỉ định iconUrl tùy chỉnh và ảnh chưa bị lỗi
  if (iconUrl && !customError) {
    return (
      <Image
        src={iconUrl}
        alt={title || cleanDomain || "icon"}
        width={size}
        height={size}
        unoptimized
        onError={() => setCustomError(true)}
        className={cn("size-full shrink-0 rounded-xs object-contain", className)}
      />
    );
  }

  // 2. Tự động lấy Favicon qua Google Favicon API từ tên miền nếu có
  if (cleanDomain && !faviconError) {
    return (
      <Image
        src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${encodeURIComponent(cleanDomain)}&size=64`}
        alt={cleanDomain}
        width={size}
        height={size}
        unoptimized
        onError={() => setFaviconError(true)}
        className={cn("size-full shrink-0 rounded-xs object-contain", className)}
      />
    );
  }

  // 3. Dự phòng vector icon theo nền tảng
  return (
    <PlatformIcon
      aria-hidden="true"
      className={cn("size-5 shrink-0", platform.color, fallbackClassName)}
    />
  );
}
