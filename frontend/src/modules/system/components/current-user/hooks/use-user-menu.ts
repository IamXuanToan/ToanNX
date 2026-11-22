"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

import { getUserDisplayName, getUserInitials } from "@/shares/components/common/user-avatar";

import { useCurrentUser } from "../../../hooks/use-current-user";
import { useLogout } from "../../../hooks/use-logout";

/**
 * Dữ liệu và hành động của menu người dùng.
 * Hỗ trợ đồng bộ trạng thái mở modal Hồ sơ cá nhân với URL query param `?profile=open`.
 *
 * @returns Người dùng, tên hiển thị, chữ cái viết tắt đại diện, trạng thái mở hồ sơ cá nhân và hàm đăng xuất.
 */
export function useUserMenu() {
  const { data } = useCurrentUser();
  const logout = useLogout();
  const searchParams = useSearchParams();

  const isProfileInUrl = searchParams.get("profile") === "open" || Boolean(searchParams.get("tab"));
  const [profileOpenManual, setProfileOpenManual] = useState<boolean | null>(null);
  const profileOpen = profileOpenManual ?? isProfileInUrl;

  // Đồng bộ đóng/mở với URL query string
  const setProfileOpen = useCallback((open: boolean) => {
    setProfileOpenManual(open);
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    if (open) {
      url.searchParams.set("profile", "open");
    } else {
      url.searchParams.delete("profile");
      url.searchParams.delete("tab");
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, []);

  const user = data?.user;
  const roles = data?.roles ?? [];
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  return {
    user,
    roles,
    displayName,
    initials,
    profileOpen,
    setProfileOpen,
    isLoggingOut: logout.isPending,
    logout: () => logout.mutate(false),
    logoutAll: () => logout.mutate(true),
  };
}
