"use client";

import {
  getUserDisplayName,
  getUserInitials,
} from "@/shares/components/common/user-avatar/user-avatar";

import { useCurrentUser } from "../../../hooks/use-current-user";
import { useLogout } from "../../../hooks/use-logout";

/**
 * Dữ liệu và hành động của menu người dùng.
 *
 * @returns Người dùng, tên hiển thị, chữ cái viết tắt đại diện và hàm đăng xuất.
 */
export function useUserMenu() {
  const { data } = useCurrentUser();
  const logout = useLogout();
  const user = data?.user;
  const roles = data?.roles ?? [];
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  return {
    user,
    roles,
    displayName,
    initials,
    isLoggingOut: logout.isPending,
    logout: () => logout.mutate(false),
    logoutAll: () => logout.mutate(true),
  };
}
