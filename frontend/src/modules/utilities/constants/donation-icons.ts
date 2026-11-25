import {
  Award,
  Beer,
  BookOpen,
  Coffee,
  Gift,
  Heart,
  type LucideIcon,
  Server,
  Smile,
  Sparkles,
  ThumbsUp,
  Utensils,
  Zap,
} from "lucide-react";

/**
 * Bản đồ liên kết mã icon dạng chuỗi sang Lucide Icon component cho mốc quyên góp.
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
