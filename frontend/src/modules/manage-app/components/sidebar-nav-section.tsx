"use client";

import { Link } from "@/i18n/navigation";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/shares/components/ui/sidebar";
import { useMessage } from "@/shares/hooks/use-message";
import type { AdminNavSection } from "@/shares/types/navigation.types";

/**
 * Link sidebar: cao 40px, icon đứng yên ở cả hai trạng thái (thu gọn chỉ bóp bề rộng),
 * mục đang chọn tô màu nhấn nhạt.
 */
const NAV_LINK_CLASS =
  "text-foreground/70 hover:bg-item-hover hover:text-foreground data-active:bg-primary-light data-active:text-primary data-active:hover:bg-primary-light data-active:hover:text-primary h-10 gap-2.5 rounded-xl px-3 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-3!";

/**
 * Một cụm mục menu trong module. Mở rộng: nhãn cụm nhỏ phía trên các mục. Thu gọn (dải icon): ẩn nhãn, cụm
 * thứ hai trở đi có vạch ngăn ở trên; tooltip của icon ghi "Cụm › Mục" để vẫn biết mục thuộc cụm nào.
 *
 * @param props - Cụm, thứ tự cụm trong module (0 = cụm đầu, không vạch ngăn), hàm kiểm mục đang mở, hàm
 *   đóng drawer mobile khi chọn.
 * @returns Khối cụm.
 */
export function SidebarNavSection({
  section,
  index,
  isActive,
  onNavigate,
}: {
  section: AdminNavSection;
  index: number;
  isActive: (href: string) => boolean;
  onNavigate: () => void;
}) {
  const message = useMessage();
  const sectionLabel = section.labelKey ? message(section.labelKey) : undefined;

  return (
    <div className="mt-2 first:mt-0" data-testid="sidebar-nav-section">
      {sectionLabel ? (
        <div className="text-muted-foreground/80 flex h-7 items-center truncate px-3 text-[11px] font-medium group-data-[collapsible=icon]:hidden">
          {sectionLabel}
        </div>
      ) : null}
      {index > 0 ? (
        <span
          aria-hidden
          className="bg-border mx-auto my-2 hidden h-px w-6 group-data-[collapsible=icon]:block"
        />
      ) : null}
      <SidebarMenu className="gap-1">
        {section.items.map((item) => {
          const label = message(item.labelKey);
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                tooltip={sectionLabel ? `${sectionLabel} › ${label}` : label}
                className={NAV_LINK_CLASS}
              >
                <Link href={item.href} onClick={onNavigate}>
                  <item.icon aria-hidden />
                  <span>{label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </div>
  );
}
