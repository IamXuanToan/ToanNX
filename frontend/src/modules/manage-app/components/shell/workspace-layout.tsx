"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { ATTACHMENT_PERMISSIONS } from "@/modules/system/permissions/attachment-permission";
import { UserMenu } from "@/modules/system/components/current-user/user-menu";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shares/components/ui/sidebar";
import { AppTooltip } from "@/shares/components/common/app-tooltip";
import type { AdminGroup } from "@/shares/types/navigation.types";

import { MANAGE_APP_ROUTES } from "../../constants/routes";
import { AdminBreadcrumb } from "./admin-breadcrumb";
import { ModuleSidebar } from "../sidebar/module-sidebar";
import { HEADER_CLASS } from "../../constants/admin-shell";
import { AdminAttachmentPickerSlot } from "./admin-attachment-picker-slot";
import { HeaderActions } from "./header-actions";
import { useGroupBreadcrumb } from "./hooks/use-group-breadcrumb";

/** Khung trong nhóm module: sidebar trái (menu chia theo module), nội dung phải. */
export function WorkspaceLayout({
  activeGroup,
  canAccessCurrentRoute = Boolean(activeGroup),
  groups,
  sidebarOpen,
  onSidebarOpenChange,
  children,
}: {
  activeGroup?: AdminGroup;
  canAccessCurrentRoute?: boolean;
  groups: AdminGroup[];
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const breadcrumb = useGroupBreadcrumb(activeGroup);
  const t = useTranslations("manageApp.shell");
  const tActions = useTranslations("common.actions");
  const canReadLibrary = usePermission(ATTACHMENT_PERMISSIONS.read);
  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={onSidebarOpenChange}>
      <ModuleSidebar
        activeGroup={activeGroup}
        groups={groups}
        footer={
          <UserMenu
            variant="sidebar"
            renderAttachmentPicker={
              canReadLibrary
                ? (pickerProps) => <AdminAttachmentPickerSlot {...pickerProps} />
                : undefined
            }
          />
        }
      />
      <SidebarInset>
        <header className={HEADER_CLASS}>
          <SidebarTrigger
            toggleLabel={tActions("toggleSidebar")}
            className="-ml-2 size-10 rounded-xl"
          />
          <AppTooltip content={t("backToModules")} side="bottom">
            <Button asChild variant="ghost" size="icon" className="text-muted-foreground">
              <Link
                href={MANAGE_APP_ROUTES.admin}
                aria-label={t("backToModules")}
                data-testid="back-to-modules"
              >
                <ArrowLeft />
              </Link>
            </Button>
          </AppTooltip>
          <div className="min-w-0 flex-1">
            <AdminBreadcrumb items={breadcrumb} />
          </div>
          <HeaderActions />
        </header>
        <div className="w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:p-8" data-testid="admin-content">
          {canAccessCurrentRoute ? children : <ForbiddenView />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
