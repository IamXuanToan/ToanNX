// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PortalProfile } from "@/modules/portal/components/profile/portal-profile";

const mockUpdateAsync = vi.fn().mockResolvedValue({});
const mockCurrentUser = {
  user: {
    id: "user-1",
    email: "admin@toannx.com",
    username: "toannx",
    fullName: "",
    firstName: "",
    lastName: "",
    isActive: true,
    isStaff: true,
    isSuperuser: true,
    isVerified: false,
    isNovel: false,
    avatar: null,
    lastLogin: "2026-11-25T10:00:00Z",
    dateJoined: "2026-01-01T00:00:00Z",
  },
  roles: [],
  permissions: [],
};

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
  usePathname: () => "/portal/profile",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({
    dateTime: () => "01/01/2026",
    relativeTime: () => "vừa xong",
  }),
  useNow: () => new Date("2026-11-25T12:00:00Z"),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/modules/system/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ data: mockCurrentUser, isLoading: false }),
}));

vi.mock("@/modules/system/hooks/use-update-profile", () => ({
  useUpdateProfile: () => ({ mutateAsync: mockUpdateAsync, isPending: false }),
}));

vi.mock("@/modules/system/hooks/use-permission", () => ({
  usePermission: () => true,
}));

vi.mock("@/modules/system/hooks/use-telegram-bot", () => ({
  useTelegramBot: () => ({
    data: {
      configured: false,
      username: "",
      displayName: "",
      botUrl: "",
    },
    isPending: false,
  }),
}));

vi.mock("@/modules/system/services/auth.service", () => ({
  authService: {
    listSocialAccounts: vi.fn().mockResolvedValue([]),
    unlinkSocialAccount: vi.fn().mockResolvedValue(undefined),
    getSocialAuthUrl: vi.fn().mockResolvedValue({ authorizationUrl: "https://example.com" }),
    sendVerificationEmail: vi.fn().mockResolvedValue({ detail: "ok" }),
  },
}));

describe("PortalProfile", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("hiển thị chữ cái viết tắt T khi chưa có fullName và tách bạch CardHeader / CardContent", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={client}>
        <PortalProfile />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("T")).toBeTruthy();
    });
    expect(screen.queryByText("?")).toBeNull();
    expect(screen.getByTestId("portal-profile-email-input")).toBeTruthy();

    // Bảo đảm TabsList nằm trong CardHeader và form không nằm trong CardHeader
    const cardHeaders = container.querySelectorAll('[data-slot="card-header"]');
    const cardContents = container.querySelectorAll('[data-slot="card-content"]');
    expect(cardHeaders.length).toBe(1);
    expect(cardContents.length).toBe(2);
    expect(cardHeaders[0].querySelector("form")).toBeNull();
    expect(cardContents[1].querySelector("form")).not.toBeNull();
  });
});
