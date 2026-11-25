"use client";

import {
  ChevronsUpDown,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { AttachmentPicker } from "@/modules/system/components/attachment/attachment-picker";
import { AUTH_WORKSPACE_PATHS } from "@/modules/system/constants/auth-storage";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { ATTACHMENT_PERMISSIONS } from "@/modules/system/permissions/attachment-permission";
import { UserAvatar } from "@/shares/components/common/user-avatar";
import { Button } from "@/shares/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shares/components/ui/dropdown-menu";

import { ProfileDialog } from "./profile-dialog";
import { useUserMenu } from "./hooks/use-user-menu";
import { AccountEmail } from "./account-email";

const ITEM_CLASS =
  "h-10 gap-2.5 rounded-xl px-3 data-highlighted:bg-destructive/10 data-highlighted:text-destructive data-highlighted:[&_svg]:text-destructive";

/**
 * Menu người dùng: thông tin cá nhân, mở dialog hồ sơ cá nhân, đăng xuất, đăng xuất mọi thiết bị.
 * `sidebar`: hàng avatar + tên ghim chân sidebar, menu mở lên trên, rộng bằng hàng.
 * `header`: nút avatar tròn trên thanh header (màn không có sidebar).
 *
 * @param props - Kiểu hiển thị.
 * @returns Menu người dùng.
 */
export function UserMenu({
  variant = "header",
  renderAttachmentPicker,
}: {
  variant?: "header" | "sidebar";
  renderAttachmentPicker?: (props: {
    onSelect: (file: { id: string; url: string }) => void;
    onClose: () => void;
  }) => React.ReactNode;
}) {
  const t = useTranslations("system.auth.userMenu");
  const pathname = usePathname();
  const { user, roles, displayName, isLoggingOut, logout, logoutAll, profileOpen, setProfileOpen } =
    useUserMenu();
  const isSidebar = variant === "sidebar";

  const isPortal =
    pathname.startsWith(AUTH_WORKSPACE_PATHS.portalViPrefix) ||
    (pathname as string).startsWith(AUTH_WORKSPACE_PATHS.portal);
  const isStaff = Boolean(user?.isStaff || user?.isSuperuser);

  const canReadAttachments = usePermission(ATTACHMENT_PERMISSIONS.read);
  const canUploadAttachments = usePermission(ATTACHMENT_PERMISSIONS.create);

  const defaultRenderPicker = canReadAttachments
    ? (pickerProps: {
        onSelect: (file: { id: string; url: string }) => void;
        onClose: () => void;
      }) => <AttachmentPicker canUpload={canUploadAttachments} {...pickerProps} />
    : undefined;

  const effectiveRenderAttachmentPicker = renderAttachmentPicker ?? defaultRenderPicker;

  const avatar = <UserAvatar user={user} size="default" className="size-8" />;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {isSidebar ? (
            <Button
              variant="ghost"
              className="hover:bg-item-hover aria-expanded:bg-item-hover group-data-[collapsible=icon]:[&_[data-slot=avatar]]:ring-foreground/10 h-10 w-full justify-start gap-2.5 overflow-hidden rounded-xl px-1 text-left whitespace-nowrap group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:hover:bg-transparent group-data-[collapsible=icon]:aria-expanded:bg-transparent group-data-[collapsible=icon]:[&_[data-slot=avatar]]:hover:ring-2"
              aria-label={t("open")}
              data-testid="user-menu"
            >
              {avatar}
              <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
                {displayName}
              </span>
              <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-full"
              aria-label={t("open")}
              data-testid="user-menu"
            >
              {avatar}
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isSidebar ? "top" : "bottom"}
          align={isSidebar ? "start" : "end"}
          sideOffset={6}
          className={
            isSidebar
              ? "w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-2xl p-1"
              : "w-64 rounded-2xl p-1"
          }
        >
          <DropdownMenuLabel className="px-3 py-2 font-normal">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            {user?.email && user.email !== displayName ? (
              <div className="text-muted-foreground text-xs">
                <AccountEmail email={user.email} />
              </div>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user ? (
            <>
              <DropdownMenuItem
                onSelect={() => setProfileOpen(true)}
                className="h-10 cursor-pointer gap-2.5 rounded-xl px-3"
                data-testid="user-profile-menu-item"
              >
                <User className="size-4 shrink-0" aria-hidden />
                <span>{t("profile")}</span>
              </DropdownMenuItem>
              {isPortal ? (
                isStaff ? (
                  <DropdownMenuItem asChild className="h-10 cursor-pointer gap-2.5 rounded-xl px-3">
                    <Link href={AUTH_WORKSPACE_PATHS.admin as never}>
                      <ShieldCheck className="text-primary size-4 shrink-0" aria-hidden />
                      <span>{t("admin")}</span>
                    </Link>
                  </DropdownMenuItem>
                ) : null
              ) : (
                <DropdownMenuItem asChild className="h-10 cursor-pointer gap-2.5 rounded-xl px-3">
                  <Link href={AUTH_WORKSPACE_PATHS.portal as never}>
                    <Sparkles className="text-primary size-4 shrink-0" aria-hidden />
                    <span>{t("portal")}</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem
            disabled={isLoggingOut}
            onSelect={logoutAll}
            className="h-10 cursor-pointer gap-2.5 rounded-xl px-3"
          >
            <MonitorSmartphone />
            {t("logoutAll")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isLoggingOut}
            onSelect={logout}
            data-testid="logout"
            className={ITEM_CLASS}
          >
            <LogOut />
            {t("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog
        user={user}
        roles={roles}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        renderAttachmentPicker={effectiveRenderAttachmentPicker}
      />
    </>
  );
}
