// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserSocialAccountsSection } from "@/modules/system/components/user/user-social-accounts-section";
import type { User } from "@/modules/system/types/user.types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "sections.socialAccounts": "Tài khoản mạng xã hội",
      "fields.linked": "Đã liên kết",
      "fields.notLinked": "Chưa liên kết",
    };
    return map[key] ?? key;
  },
  useFormatter: () => ({
    dateTime: () => "20/11/2026, 14:30",
  }),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

afterEach(() => {
  cleanup();
});

const baseUser: User = {
  id: "user-123",
  email: "admin@example.com",
  username: "admin",
  fullName: "Nguyễn Xuân Toàn",
  avatar: null,
  isActive: true,
  isStaff: true,
  isSuperuser: true,
  isNovel: true,
  isVerified: true,
  socialAccounts: [],
  lastLogin: "2026-11-20T10:00:00Z",
  lastSeenAt: "2026-11-20T12:00:00Z",
  dateJoined: "2026-01-01T00:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-11-20T12:00:00Z",
};

describe("UserSocialAccountsSection", () => {
  it("hiển thị trạng thái Chưa liên kết khi người dùng chưa kết nối Google hoặc GitHub", () => {
    render(<UserSocialAccountsSection user={baseUser} />);

    expect(screen.getByText("Tài khoản mạng xã hội")).toBeDefined();
    expect(screen.getByText("Google")).toBeDefined();
    expect(screen.getByText("GitHub")).toBeDefined();

    const notLinkedBadges = screen.getAllByText("Chưa liên kết");
    expect(notLinkedBadges.length).toBeGreaterThanOrEqual(2);
  });

  it("hiển thị chi tiết Đã liên kết, email, UID và ngày liên kết khi có tài khoản", () => {
    const linkedUser: User = {
      ...baseUser,
      socialAccounts: [
        {
          id: "soc-1",
          provider: "google",
          uid: "google-uid-12345",
          email: "toannx.dev@gmail.com",
          displayName: "Toàn Nguyễn",
          createdAt: "2026-11-20T14:30:00Z",
        },
      ],
    };

    render(<UserSocialAccountsSection user={linkedUser} />);

    expect(screen.getByText("Đã liên kết")).toBeDefined();
    expect(screen.getByText("toannx.dev@gmail.com")).toBeDefined();
    expect(screen.getByText("Toàn Nguyễn")).toBeDefined();
    expect(screen.getByText("UID: google-uid-12345")).toBeDefined();
    expect(screen.getByText("20/11/2026, 14:30")).toBeDefined();
  });
});
