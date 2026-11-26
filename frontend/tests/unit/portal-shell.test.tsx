// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import commonVi from "@/messages/vi.json";
import { PortalShell } from "@/modules/portal/components/layout/portal-shell";
import portalVi from "@/modules/portal/messages/vi.json";
import systemVi from "@/modules/system/messages/vi.json";
import { ApiError } from "@/shares/lib/api/api-error";
import { useAuthStore } from "@/store/auth-store";

const mockReplace = vi.fn();
const mockUseCurrentUser = vi.fn();

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
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  usePathname: () => "/portal/finance/sepay",
}));

vi.mock("@/modules/system/hooks/use-current-user", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock("@/modules/portal/components/layout/portal-sidebar", () => ({
  PortalSidebar: () => <aside data-testid="portal-sidebar-stub" />,
}));

vi.mock("@/modules/portal/components/layout/portal-header", () => ({
  PortalHeader: () => <header data-testid="portal-header-stub" />,
}));

vi.mock("@/modules/portal/components/layout/portal-bottom-nav", () => ({
  PortalBottomNav: () => <nav data-testid="portal-bottom-nav-stub" />,
}));

vi.mock("@/modules/workspace/components/assistant/assistant-floating-widget", () => ({
  AssistantFloatingWidget: () => <div data-testid="assistant-floating-widget-stub" />,
}));

function renderPortalShell() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider
        locale="vi"
        messages={{ ...commonVi, portal: portalVi, system: systemVi }}
      >
        <PortalShell>
          <div data-testid="portal-child">Nội dung Studio</div>
        </PortalShell>
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  useAuthStore.getState().resetSession();
});

describe("PortalShell", () => {
  it("chuyển về trang đăng nhập kèm tham số next khi API trả 401 chưa đăng nhập", async () => {
    window.history.replaceState({}, "", "/vi/ca-nhan/tai-chinh/ket-noi-sepay");
    mockUseCurrentUser.mockReturnValue({
      isPending: false,
      isError: true,
      error: new ApiError({
        status: 401,
        code: "AUTH_NOT_AUTHENTICATED",
        message: "Chưa đăng nhập",
      }),
      data: undefined,
      refetch: vi.fn(),
    });

    renderPortalShell();

    expect(screen.queryByTestId("portal-child")).toBeNull();
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/login",
        query: { next: "/vi/ca-nhan/tai-chinh/ket-noi-sepay" },
      });
    });
  });

  it("hiển thị trạng thái lỗi và cho phép thử lại khi lỗi mạng ngoài 401", () => {
    const refetch = vi.fn();
    mockUseCurrentUser.mockReturnValue({
      isPending: false,
      isError: true,
      error: new ApiError({
        status: 500,
        code: "INTERNAL_ERROR",
        message: "Lỗi máy chủ",
      }),
      data: undefined,
      refetch,
    });

    renderPortalShell();

    const retryButton = screen.getByRole("button");
    fireEvent.click(retryButton);
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("hiển thị khung Portal và nội dung con khi người dùng đã đăng nhập hợp lệ", () => {
    mockUseCurrentUser.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: { user: { id: "u1", email: "portal.member@toannx.local" }, permissions: [] },
      refetch: vi.fn(),
    });

    renderPortalShell();

    expect(screen.getByTestId("portal-sidebar-stub")).toBeTruthy();
    expect(screen.getByTestId("portal-header-stub")).toBeTruthy();
    expect(screen.getByTestId("assistant-floating-widget-stub")).toBeTruthy();
    expect(screen.getByTestId("portal-child").textContent).toBe("Nội dung Studio");
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
