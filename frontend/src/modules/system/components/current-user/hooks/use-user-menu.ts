"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

import { getUserInitials } from "@/shares/components/common/user-avatar";
import { formatUserDisplayName } from "@/shares/lib/user-display";

import { PROFILE_DIALOG_QUERY } from "../../../constants/auth-storage";
import { useCurrentUser } from "../../../hooks/use-current-user";
import { useLogout } from "../../../hooks/use-logout";

/**
 * Dữ liệu và hành động của menu người dùng.
 * Chỉ đồng bộ trạng thái mở modal Hồ sơ cá nhân với `?profile=open` (không bắt nhầm `?tab=` của trang chính).
 *
 * @returns Người dùng, tên hiển thị, chữ cái viết tắt đại diện, trạng thái mở hồ sơ cá nhân và hàm đăng xuất.
 */
export function useUserMenu() {
  const { data } = useCurrentUser();
  const logout = useLogout();
  const searchParams = useSearchParams();

  const isProfileInUrl =
    searchParams.get(PROFILE_DIALOG_QUERY.openParam) === PROFILE_DIALOG_QUERY.openValue;
  const [prevUrlOpen, setPrevUrlOpen] = useState(isProfileInUrl);
  const [profileOpen, setProfileOpenState] = useState(isProfileInUrl);

  if (prevUrlOpen !== isProfileInUrl) {
    setPrevUrlOpen(isProfileInUrl);
    setProfileOpenState(isProfileInUrl);
  }

  // Đồng bộ đóng/mở với URL query string mà không đụng tới `?tab=` của trang nền
  const setProfileOpen = useCallback((open: boolean) => {
    setProfileOpenState(open);
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    if (open) {
      url.searchParams.set(PROFILE_DIALOG_QUERY.openParam, PROFILE_DIALOG_QUERY.openValue);
    } else {
      url.searchParams.delete(PROFILE_DIALOG_QUERY.openParam);
      url.searchParams.delete(PROFILE_DIALOG_QUERY.tabParam);
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, []);

  const user = data?.user;
  const roles = data?.roles ?? [];
  const displayName = formatUserDisplayName(user, { includeUsername: false });
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
