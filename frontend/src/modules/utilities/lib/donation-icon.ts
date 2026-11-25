import { type LucideIcon, Sparkles } from "lucide-react";

import { DONATION_ICON_COMPONENTS } from "../constants/donation-icons";

/**
 * Lấy component icon Lucide tương ứng với chuỗi định danh mốc quyên góp.
 *
 * @param iconKey - Chuỗi mã định danh icon.
 * @returns Component icon Lucide hoặc Sparkles mặc định.
 */
export function getDonationLucideIcon(iconKey?: string): LucideIcon {
  if (!iconKey) return Sparkles;
  return DONATION_ICON_COMPONENTS[iconKey] ?? Sparkles;
}
