"use client";

import { Check, ChevronsUpDown, LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shares/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shares/components/ui/sidebar";
import type { AdminGroup } from "@/shares/types/navigation.types";

import { MANAGE_APP_ROUTES } from "../constants/routes";

/**
 * Đầu sidebar: nhóm module đang đứng + menu chuyển sang nhóm khác hoặc về màn chọn module.
 *
 * @param props - Nhóm đang đứng (có thể không có khi không có quyền) và các nhóm vào được.
 * @returns Nút chuyển nhóm.
 */
export function ModuleSwitcher({
  activeGroup,
  groups,
}: {
  activeGroup?: AdminGroup;
  groups: AdminGroup[];
}) {
  const t = useTranslations("common.nav");
  const { isMobile, setOpenMobile } = useSidebar();
  const close = () => setOpenMobile(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={activeGroup?.name ?? t("allModules")}
              className="hover:bg-item-hover data-open:bg-item-hover h-10 gap-2.5 rounded-xl px-1 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-1!"
              data-testid="module-switcher"
            >
              <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                {activeGroup ? <activeGroup.icon aria-hidden /> : <LayoutGrid aria-hidden />}
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-medium">{activeGroup?.name ?? t("allModules")}</span>
                <span className="text-muted-foreground truncate text-xs">{t("switchModule")}</span>
              </span>
              <ChevronsUpDown className="text-muted-foreground ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-2xl p-1"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {t("modulesLabel")}
            </DropdownMenuLabel>
            {groups.map((group) => {
              const current = group.code === activeGroup?.code;
              return (
                <DropdownMenuItem key={group.code} asChild className="h-10 gap-2.5 rounded-xl px-2">
                  <Link
                    href={group.href}
                    onClick={close}
                    aria-current={current ? "page" : undefined}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md border">
                      <group.icon className="size-3.5" aria-hidden />
                    </span>
                    <span className="truncate">{group.name}</span>
                    {current ? <Check className="text-primary ml-auto" /> : null}
                  </Link>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="h-10 gap-2.5 rounded-xl px-2">
              <Link href={MANAGE_APP_ROUTES.admin} onClick={close}>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md border">
                  <LayoutGrid className="size-3.5" />
                </span>
                {t("allModules")}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
