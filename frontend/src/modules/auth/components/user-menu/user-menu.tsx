"use client";

import { LogOut, MonitorSmartphone } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/shares/components/ui/avatar";
import { Button } from "@/shares/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shares/components/ui/dropdown-menu";

import { useUserMenu } from "./hooks/use-user-menu";

/**
 * Menu người dùng: thông tin, đăng xuất, đăng xuất mọi thiết bị.
 *
 * @returns Menu người dùng.
 */
export function UserMenu() {
  const t = useTranslations("auth.userMenu");
  const { user, displayName, initials, isLoggingOut, logout, logoutAll } = useUserMenu();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={t("open")}
          data-testid="user-menu"
        >
          <Avatar className="size-8">
            {user?.avatar ? <AvatarImage src={user.avatar.url} alt="" /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isLoggingOut} onSelect={logout} data-testid="logout">
          <LogOut />
          {t("logout")}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isLoggingOut} onSelect={logoutAll}>
          <MonitorSmartphone />
          {t("logoutAll")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
