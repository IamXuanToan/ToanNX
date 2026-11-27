"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { Badge } from "@/shares/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/shares/components/ui/hover-card";
import { useMessage } from "@/shares/hooks/use-message";
import type { AdminGroup, AdminNavItem } from "@/shares/types/navigation.types";

/** Thuộc tính của component hiển thị popover các mục còn lại trong thẻ nhóm module. */
export type ModuleGroupCardMoreItemsProps = {
  /** Thông tin nhóm module quản trị. */
  group: AdminGroup;
  /** Danh sách toàn bộ các mục tính năng trực thuộc nhóm. */
  items: AdminNavItem[];
  /** Số lượng mục vượt quá ngưỡng hiển thị trực tiếp trên thẻ. */
  remainingCount: number;
};

/**
 * Nút badge "+X" kèm popover hiển thị đầy đủ danh sách tính năng trực thuộc nhóm module khi hover.
 * Ngăn chặn sự kiện click lan truyền lên thẻ Link bao bọc bên ngoài của thẻ nhóm.
 *
 * @param props - Thuộc tính component.
 * @param props.group - Thông tin nhóm module quản trị.
 * @param props.items - Danh sách toàn bộ tính năng con của nhóm module.
 * @param props.remainingCount - Số lượng mục còn lại chưa hiển thị trực tiếp.
 * @returns Khối badge kích hoạt hover card hiển thị danh sách tính năng.
 */
export function ModuleGroupCardMoreItems({
  group,
  items,
  remainingCount,
}: ModuleGroupCardMoreItemsProps) {
  const t = useTranslations("manageApp");
  const message = useMessage();

  return (
    <HoverCard openDelay={100} closeDelay={150}>
      <HoverCardTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          aria-label={`${group.name} - ${t("moreItemsTrigger", { count: remainingCount })}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          className="bg-muted/50 hover:bg-muted/90 border-border/70 hover:border-border text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center rounded-lg border px-2 py-0.5 text-xs font-semibold transition-colors select-none"
        >
          +{remainingCount}
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="bg-popover text-popover-foreground border-border/80 ring-foreground/5 z-50 w-72 rounded-xl border p-3 shadow-lg ring-1"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Tiêu đề nhóm và tổng số lượng mục */}
        <div className="border-border/60 flex items-center justify-between border-b pb-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <group.icon className="text-primary size-4 shrink-0" aria-hidden />
            <span className="text-foreground truncate text-xs font-semibold">{group.name}</span>
          </div>
          <Badge
            variant="secondary"
            className="border-border/60 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          >
            {items.length} {t("itemUnit")}
          </Badge>
        </div>

        {/* Danh sách toàn bộ tính năng có thể điều hướng trực tiếp */}
        <div className="mt-2 flex max-h-80 flex-col gap-0.5 overflow-y-auto pr-0.5">
          {items.map((item) => (
            <AppTooltip key={item.href} content={message(item.labelKey)} side="right">
              <Link
                href={item.href}
                className="hover:bg-muted/80 hover:text-primary text-foreground/85 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
              >
                <item.icon className="text-primary size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{message(item.labelKey)}</span>
              </Link>
            </AppTooltip>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
