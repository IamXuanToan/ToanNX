"use client";

import { BellPlus, CalendarCheck, Clock3, HelpCircle, Laptop, Trash2, Wallet } from "lucide-react";

import { Badge } from "@/shares/components/ui/badge";
import { cn } from "cn";

import {
  ASSISTANT_SLASH_BADGE_STYLES,
  type AssistantSlashCommandSpec,
} from "../../constants/defaults";

const COMMAND_ICONS: Record<AssistantSlashCommandSpec["key"], typeof CalendarCheck> = {
  today: CalendarCheck,
  upcoming: Clock3,
  spending: Wallet,
  assets: Laptop,
  remind: BellPlus,
  clear: Trash2,
  help: HelpCircle,
};

/**
 * Thẻ badge trường trộn cho câu lệnh Trợ lý AI (`/hom_nay` -> `[Icon] Hôm nay`).
 * Dùng chung ở thanh lệnh nhanh, menu gợi ý `/` và trong bong bóng tin nhắn người dùng.
 *
 * @param props - Khóa lệnh chuẩn, nhãn đã dịch và kích thước/class tuỳ biến.
 * @returns Badge trường trộn gọn, sắc nét theo token Light/Dark.
 */
export function AssistantCommandBadge({
  commandKey,
  label,
  className,
}: {
  commandKey: AssistantSlashCommandSpec["key"];
  label: string;
  className?: string;
}) {
  const Icon = COMMAND_ICONS[commandKey];
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 gap-1 rounded-full px-2.5 text-[11px] font-medium transition-colors",
        ASSISTANT_SLASH_BADGE_STYLES[commandKey],
        className,
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      <span>{label}</span>
    </Badge>
  );
}
