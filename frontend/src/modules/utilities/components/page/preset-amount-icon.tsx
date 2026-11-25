"use client";

import { BookOpen, Coffee, Heart, Server, Sparkles, Utensils } from "lucide-react";

import { DonationAmountIcon } from "./donation-amount-icon";

/**
 * Component hiển thị icon mốc ủng hộ gợi ý theo icon tùy chỉnh hoặc tự động bóc tách từ tên,
 * trả về trực tiếp JSX element và khai báo ngoài render body để tuân thủ React static components.
 *
 * @param props - Tiêu đề mốc, mã icon tùy chỉnh và class CSS.
 * @returns Component icon hiển thị.
 */
export function PresetAmountIcon({
  title,
  customIcon,
  className,
}: {
  title: string | null;
  customIcon?: string;
  className?: string;
}) {
  if (customIcon) {
    return <DonationAmountIcon iconKey={customIcon} className={className} />;
  }
  if (!title) return <Sparkles className={className} />;
  const lower = title.toLowerCase();

  if (
    lower.includes("cà phê") ||
    lower.includes("cafe") ||
    lower.includes("coffee") ||
    lower.includes("trà") ||
    lower.includes("tea") ||
    lower.includes("nước") ||
    lower.includes("drink")
  ) {
    return <Coffee className={className} />;
  }
  if (
    lower.includes("sáng") ||
    lower.includes("ăn") ||
    lower.includes("cơm") ||
    lower.includes("bánh") ||
    lower.includes("trưa") ||
    lower.includes("tối") ||
    lower.includes("breakfast") ||
    lower.includes("lunch") ||
    lower.includes("dinner") ||
    lower.includes("meal")
  ) {
    return <Utensils className={className} />;
  }
  if (
    lower.includes("sách") ||
    lower.includes("tài liệu") ||
    lower.includes("học") ||
    lower.includes("khóa") ||
    lower.includes("book") ||
    lower.includes("study") ||
    lower.includes("course")
  ) {
    return <BookOpen className={className} />;
  }
  if (
    lower.includes("server") ||
    lower.includes("máy chủ") ||
    lower.includes("vps") ||
    lower.includes("hosting") ||
    lower.includes("cloud")
  ) {
    return <Server className={className} />;
  }
  if (
    lower.includes("ủng hộ") ||
    lower.includes("yêu thích") ||
    lower.includes("tài trợ") ||
    lower.includes("donate") ||
    lower.includes("support") ||
    lower.includes("sponsor")
  ) {
    return <Heart className={className} />;
  }

  return <Sparkles className={className} />;
}
