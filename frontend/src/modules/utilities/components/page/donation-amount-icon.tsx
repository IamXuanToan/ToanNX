"use client";

import {
  Award,
  Beer,
  BookOpen,
  Coffee,
  Gift,
  Heart,
  Server,
  Smile,
  Sparkles,
  ThumbsUp,
  type LucideIcon,
  Utensils,
  Zap,
} from "lucide-react";

/**
 * Bản đồ liên kết mã icon dạng chuỗi sang Lucide Icon component.
 */
export const DONATION_ICON_COMPONENTS: Record<string, LucideIcon> = {
  coffee: Coffee,
  utensils: Utensils,
  heart: Heart,
  sparkles: Sparkles,
  beer: Beer,
  gift: Gift,
  book: BookOpen,
  server: Server,
  zap: Zap,
  smile: Smile,
  "thumbs-up": ThumbsUp,
  award: Award,
};

/**
 * Lấy component icon Lucide tương ứng với chuỗi định danh.
 *
 * @param iconKey - Chuỗi mã định danh icon.
 * @returns Component icon Lucide hoặc Sparkles mặc định.
 */
export function getDonationLucideIcon(iconKey?: string): LucideIcon {
  if (!iconKey) return Sparkles;
  return DONATION_ICON_COMPONENTS[iconKey] ?? Sparkles;
}

/**
 * Component hiển thị biểu tượng mốc ủng hộ theo chuỗi định danh iconKey,
 * được định nghĩa ở cấp module ngoài render loop để tuân thủ React static components.
 *
 * @param props - Mã iconKey và class CSS.
 * @returns Component icon Lucide tương ứng.
 */
export function DonationAmountIcon({
  iconKey,
  className,
}: {
  iconKey?: string;
  className?: string;
}) {
  const IconComp = DONATION_ICON_COMPONENTS[iconKey ?? ""] ?? Sparkles;
  return <IconComp className={className} />;
}
