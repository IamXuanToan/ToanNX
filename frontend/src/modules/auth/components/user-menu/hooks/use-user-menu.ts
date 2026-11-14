"use client";

import { useCurrentUser } from "../../../hooks/use-current-user";
import { useLogout } from "../../../hooks/use-logout";

/**
 * Dữ liệu và hành động của menu người dùng.
 *
 * @returns Người dùng, chữ viết tắt và hàm đăng xuất.
 */
export function useUserMenu() {
  const { data } = useCurrentUser();
  const logout = useLogout();
  const user = data?.user;
  const displayName = user?.fullName || user?.email || "";
  const initialsSource = user?.fullName || user?.email.split("@")[0] || "";
  const initials =
    (initialsSource.match(/\b\p{L}/gu) ?? []).slice(-2).join("").toUpperCase() || "?";
  return {
    user,
    displayName,
    initials,
    isLoggingOut: logout.isPending,
    logout: () => logout.mutate(false),
    logoutAll: () => logout.mutate(true),
  };
}
