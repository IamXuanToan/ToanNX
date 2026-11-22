"use client";

import { cn } from "cn";
import { ChevronDown } from "lucide-react";

import { Button } from "@/shares/components/ui/button";
import type { AdminModule } from "@/shares/types/navigation.types";

import { groupNavSections } from "../../constants/admin-navigation";
import { useSidebarModuleGroup } from "./hooks/use-sidebar-module-group";
import { SidebarNavSection } from "./sidebar-nav-section";

/**
 * Một module trong sidebar: các cụm mục (`SidebarNavSection`). Nhóm chỉ có một module (mọi nhóm hiện tại) thì
 * **không có nhãn module** (tên đã nằm ở bộ chuyển nhóm phía trên, lặp lại là thừa). Nhóm nhiều module thì có
 * nhãn IN HOA bấm để thu gọn; lúc sidebar thu về dải icon, nhãn mờ tại chỗ thay bằng gạch ngắn.
 *
 * @param props - Module (mục đã lọc quyền), có hiện nhãn module không, hàm kiểm mục đang mở, hàm đóng drawer
 *   mobile khi chọn.
 * @returns Khối module.
 */
export function SidebarModuleGroup({
  module,
  showHeader,
  isActive,
  onNavigate,
}: {
  module: AdminModule;
  showHeader: boolean;
  isActive: (href: string) => boolean;
  onNavigate: () => void;
}) {
  const { expanded, contentId, toggleOpen } = useSidebarModuleGroup({ module, isActive });
  const sections = groupNavSections(module.items).map((section, index) => (
    <SidebarNavSection
      key={`${section.labelKey ?? "default"}-${index}`}
      section={section}
      index={index}
      isActive={isActive}
      onNavigate={onNavigate}
    />
  ));

  if (!showHeader) {
    return (
      <div className="mt-4 first:mt-0" data-testid={`sidebar-module-${module.code}`}>
        {sections}
      </div>
    );
  }

  return (
    <div className="mt-4 first:mt-0" data-testid={`sidebar-module-${module.code}`}>
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={toggleOpen}
          className="text-muted-foreground hover:bg-item-hover hover:text-foreground flex h-10 w-full items-center justify-between rounded-xl px-3 text-xs font-medium tracking-wide whitespace-nowrap uppercase outline-hidden transition-[background-color,color,opacity] duration-150 group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0"
        >
          <span className="min-w-0 truncate">{module.name}</span>
          <ChevronDown
            aria-hidden
            className={cn(
              "ml-auto size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none",
              !expanded && "-rotate-90",
            )}
          />
        </Button>
        <span
          aria-hidden
          className="bg-border pointer-events-none absolute top-1/2 left-6 h-px w-4 opacity-0 transition-opacity duration-150 group-data-[collapsible=icon]:opacity-100"
        />
      </div>
      <div
        id={contentId}
        inert={!expanded}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">{sections}</div>
      </div>
    </div>
  );
}
