"use client";

import { Sparkles } from "lucide-react";

import { DONATION_ICON_COMPONENTS } from "../../constants/donation-icons";

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
