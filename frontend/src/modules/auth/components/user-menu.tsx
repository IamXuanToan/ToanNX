"use client";

import { ChevronsUpDown, LogOut, MonitorSmartphone, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { UserAvatar } from "@/shares/components/common/user-avatar";
import { Button } from "@/shares/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shares/components/ui/dropdown-menu";

import { ProfileDialog } from "./profile-dialog";
import { useUserMenu } from "./hooks/use-user-menu";

const ITEM_CLASS =
  "h-10 gap-2.5 rounded-xl px-3 data-highlighted:bg-destructive/10 data-highlighted:text-destructive data-highlighted:[&_svg]:text-destructive";

/**
 * Email một dòng: cắt phần trước `@`, giữ nguyên tên miền.
 *
 * @param props - Email.
 * @returns Email rút gọn.
 */
function AccountEmail({ email }: { email: string }) {
  const at = email.lastIndexOf("@");
  if (at < 0) return <span className="block truncate">{email}</span>;
  return (
    <span className="flex min-w-0" title={email}>
      <span className="truncate">{email.slice(0, at)}</span>
      <span className="shrink-0">{email.slice(at)}</span>
    </span>
  );
}

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
  const t = useTranslations("auth.userMenu");
  const { user, roles, displayName, isLoggingOut, logout, logoutAll, profileOpen, setProfileOpen } =
    useUserMenu();
  const isSidebar = variant === "sidebar";

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
        renderAttachmentPicker={renderAttachmentPicker}
      />
    </>
  );
}
