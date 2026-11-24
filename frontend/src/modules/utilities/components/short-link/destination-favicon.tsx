"use client";

import { useState } from "react";
import Image from "next/image";
import { Globe } from "lucide-react";
import { cn } from "cn";

interface DestinationFaviconProps {
  /** Domain của trang đích (ví dụ: facebook.com, youtube.com). */
  domain?: string | null;
  /** Class áp dụng cho ảnh favicon khi tải thành công. */
  className?: string;
  /** Class áp dụng cho icon Globe dự phòng. */
  fallbackClassName?: string;
  /** Kích thước hiển thị (px), mặc định 20. */
  size?: number;
}

/**
 * Hiển thị Favicon của trang web đích dựa trên domain thông qua Google Favicon V2 API (gstatic).
 * Nếu không có domain hoặc ảnh lỗi, tự động chuyển về icon Globe vector chuẩn của hệ thống.
 */
export function DestinationFavicon({
  domain,
  className,
  fallbackClassName,
  size = 20,
}: DestinationFaviconProps) {
  // Chuẩn hóa domain (loại bỏ cổng nếu có, chuyển về chữ thường)
  const cleanDomain = domain ? domain.split(":")[0]?.toLowerCase().trim() : "";
  const [failedDomain, setFailedDomain] = useState<string | null>(null);

  const hasError = failedDomain === cleanDomain;

  if (!cleanDomain || hasError) {
    return <Globe aria-hidden="true" className={cn("size-4.5 sm:size-5", fallbackClassName)} />;
  }

  return (
    <Image
      src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${encodeURIComponent(cleanDomain)}&size=64`}
      alt={cleanDomain}
      width={size}
      height={size}
      unoptimized
      onError={() => setFailedDomain(cleanDomain)}
      className={cn("size-4.5 shrink-0 rounded-xs object-contain sm:size-5", className)}
    />
  );
}
