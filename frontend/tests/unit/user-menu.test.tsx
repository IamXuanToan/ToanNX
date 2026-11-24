// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserMenu } from "@/modules/system/components/current-user/user-menu";
import type { AuthUser } from "@/modules/system/types/auth.types";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin",
}));

const mockLogout = vi.fn();
const mockLogoutAll = vi.fn();

const mockUser: AuthUser = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "nxtoan2k4@gmail.com",
  username: "toannx",
  fullName: "Nguyễn Xuân Toàn",
  avatar: null,
  isActive: true,
  isStaff: true,
  isSuperuser: true,
  isNovel: false,
  isVerified: true,
  emailVerifiedAt: null,
  lastLogin: null,
  lastSeenAt: null,
  dateJoined: "2026-01-01T00:00:00Z",
};

vi.mock("@/modules/system/components/current-user/hooks/use-user-menu", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  return {
    useUserMenu: () => {
      const [profileOpen, setProfileOpen] = React.useState(false);
      return {
        user: mockUser,
        displayName: "Nguyễn Xuân Toàn",
        isLoggingOut: false,
        profileOpen,
        setProfileOpen,
        logout: mockLogout,
        logoutAll: mockLogoutAll,
      };
    },
  };
});

vi.mock("@/modules/system/hooks/use-update-profile", () => ({
  useUpdateProfile: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUploadAvatar: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useRemoveAvatar: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      open: "Mở menu tài khoản",
      profile: "Hồ sơ cá nhân",
      logout: "Đăng xuất",
      logoutAll: "Đăng xuất mọi thiết bị",
      title: "Hồ sơ cá nhân",
      description: "Quản lý thông tin tài khoản và cập nhật bảo mật của bạn.",
      lastName: "Họ và tên đệm",
      firstName: "Tên",
      username: "Tên người dùng",
      securitySection: "Đổi mật khẩu",
      securityHint: "Để trống nếu bạn không muốn đổi mật khẩu hiện tại.",
      newPassword: "Mật khẩu mới",
      confirmPassword: "Xác nhận mật khẩu mới",
      save: "Lưu thay đổi",
      cancel: "Hủy",
    };
    return map[key] ?? key;
  },
  useFormatter: () => ({
    dateTime: () => "01/01/2026 12:00",
    relativeTime: () => "vừa xong",
  }),
  useNow: () => new Date(),
}));

describe("UserMenu", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("mở menu khi bấm avatar và mở dialog hồ sơ cá nhân khi chọn", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <UserMenu variant="header" />
      </QueryClientProvider>,
    );

    // Click mở menu
    const trigger = screen.getByTestId("user-menu");
    fireEvent.pointerDown(trigger);

    // Menu có mục Hồ sơ cá nhân
    const profileItem = screen.getByTestId("user-profile-menu-item");
    expect(profileItem).toBeTruthy();

    // Click vào Hồ sơ cá nhân
    fireEvent.click(profileItem);

    // Dialog hồ sơ cá nhân được mở
    expect(screen.getByTestId("profile-dialog")).toBeTruthy();
  });
});
