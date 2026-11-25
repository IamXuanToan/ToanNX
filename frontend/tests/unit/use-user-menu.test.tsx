// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserMenu } from "@/modules/system/components/current-user/hooks/use-user-menu";

let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/modules/system/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    data: {
      user: {
        id: "user-1",
        email: "demo@toannx.local",
        username: "demo",
        fullName: "Demo User",
      },
      roles: [],
    },
  }),
}));

vi.mock("@/modules/system/hooks/use-logout", () => ({
  useLogout: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe("useUserMenu", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
    window.history.replaceState(null, "", "/vi/ca-nhan/trang/123");
  });

  it("không tự mở dialog Hồ sơ cá nhân khi URL chỉ có ?tab=settings của trang chính", () => {
    mockSearchParams = new URLSearchParams("tab=settings");
    window.history.replaceState(null, "", "/vi/ca-nhan/trang/123?tab=settings");

    const { result, rerender } = renderHook(() => useUserMenu());
    expect(result.current.profileOpen).toBe(false);

    mockSearchParams = new URLSearchParams("tab=design");
    rerender();
    expect(result.current.profileOpen).toBe(false);
  });

  it("chỉ mở dialog khi URL có ?profile=open và khi đóng giữ nguyên ?tab= của trang chính", () => {
    mockSearchParams = new URLSearchParams("tab=settings&profile=open&profileTab=social");
    window.history.replaceState(
      null,
      "",
      "/vi/ca-nhan/trang/123?tab=settings&profile=open&profileTab=social",
    );

    const { result } = renderHook(() => useUserMenu());
    expect(result.current.profileOpen).toBe(true);

    act(() => {
      result.current.setProfileOpen(false);
    });
    expect(result.current.profileOpen).toBe(false);
    expect(window.location.search).toBe("?tab=settings");

    act(() => {
      result.current.setProfileOpen(true);
    });
    expect(result.current.profileOpen).toBe(true);
    expect(window.location.search).toContain("tab=settings");
    expect(window.location.search).toContain("profile=open");
  });
});
