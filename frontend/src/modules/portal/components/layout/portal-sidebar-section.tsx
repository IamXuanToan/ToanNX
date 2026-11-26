"use client";

import { cn } from "cn";
import { ChevronDown, type LucideIcon } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shares/components/ui/button";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/shares/components/ui/sidebar";

import { usePortalSidebarSection } from "./hooks/use-portal-sidebar-section";

const NAV_LINK_CLASS =
  "text-foreground/70 hover:bg-item-hover hover:text-foreground data-active:bg-primary-light data-active:text-primary data-active:hover:bg-primary-light data-active:hover:text-primary h-10 gap-2.5 rounded-xl px-3 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-3!";

/** Mục menu đã dịch nhãn và kiểm active sẵn sàng hiển thị. */
export type ResolvedPortalNavItem = {
  key: string;
  title: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
};

/**
 * Một cụm mục menu trong Sidebar Portal.
 * - Cụm `hideHeader` (Tổng quan) chỉ render nút đơn gọn trên cùng.
 * - Các cụm chức năng (`Cá nhân`, `Tiện ích`, `Tài chính`) hỗ trợ thu gọn/mở rộng có lưu trạng thái;
 *   nhóm chứa trang đang mở luôn tự động mở; ở chế độ dải icon thì ẩn chữ, hiện vạch ngăn và tooltip `"Cụm › Mục"`.
 *
 * @param props - Mã cụm, nhãn cụm, cờ ẩn tiêu đề, thứ tự cụm, danh sách mục và hàm đóng drawer mobile.
 * @returns Khối cụm Sidebar.
 */
export function PortalSidebarSection({
  sectionKey,
  label,
  hideHeader = false,
  index,
  items,
  onNavigate,
}: {
  sectionKey: string;
  label: string;
  hideHeader?: boolean;
  index: number;
  items: readonly ResolvedPortalNavItem[];
  onNavigate: () => void;
}) {
  const hasActive = items.some((item) => item.active);
  const { expanded, contentId, toggleOpen } = usePortalSidebarSection(sectionKey, hasActive);

  const menu = (
    <SidebarMenu className="gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <SidebarMenuItem key={item.key}>
            <SidebarMenuButton
              asChild
              isActive={item.active}
              tooltip={hideHeader ? item.title : `${label} › ${item.title}`}
              className={NAV_LINK_CLASS}
            >
              <Link href={item.href as never} onClick={onNavigate}>
                <Icon aria-hidden className="size-4 shrink-0" />
                <span className="truncate">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  if (hideHeader) {
    return <div className="mb-1.5">{menu}</div>;
  }

  return (
    <div className="mt-2 first:mt-0" data-testid={`portal-sidebar-section-${sectionKey}`}>
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={toggleOpen}
          className="text-muted-foreground/85 hover:bg-item-hover hover:text-foreground flex h-8 w-full items-center justify-between rounded-lg px-3 text-[11px] font-semibold tracking-wider whitespace-nowrap uppercase outline-hidden transition-colors group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:hidden"
        >
          <span className="truncate">{label}</span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-200 motion-reduce:transition-none",
              !expanded && "-rotate-90",
            )}
          />
        </Button>
        {index > 0 ? (
          <span
            aria-hidden
            className="bg-border mx-auto my-2 hidden h-px w-6 group-data-[collapsible=icon]:block"
          />
        ) : null}
      </div>

      <div
        id={contentId}
        inert={!expanded}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">{menu}</div>
      </div>
    </div>
  );
}
