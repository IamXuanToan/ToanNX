// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PublicHeader } from "@/modules/home/components/public-header";

let mockPathname = "/";

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
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      login: "Đăng nhập",
      admin: "Quản trị",
      label: "Ngôn ngữ",
      vi: "Tiếng Việt",
      en: "English",
      toggle: "Đổi giao diện",
    };
    return map[key] ?? key;
  },
  useLocale: () => "vi",
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    setTheme: vi.fn(),
  }),
}));

vi.mock("@/shares/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

afterEach(cleanup);

describe("PublicHeader", () => {
  it("trên trang chủ (/): chỉ hiển thị Logo và Nút chuyển ngôn ngữ; không hiện Đổi theme và Đăng nhập", () => {
    mockPathname = "/";

    render(<PublicHeader />);

    // 1. Logo
    expect(screen.getByLabelText("ToanNX")).toBeTruthy();

    // 2. LanguageSwitcher
    expect(screen.getByTestId("language-switcher")).toBeTruthy();

    // 3. ThemeSwitcher: không hiển thị trên trang chủ
    expect(screen.queryByTestId("theme-switcher")).toBeNull();

    // 4. Login button: không hiển thị trên trang chủ
    expect(screen.queryByRole("link", { name: "Đăng nhập" })).toBeNull();
  });

  it("trên trang phụ khác (/page-view/doc/test): hiển thị đầy đủ LanguageSwitcher, ThemeSwitcher và Đăng nhập", () => {
    mockPathname = "/page-view/doc/test";

    render(<PublicHeader />);

    expect(screen.getByTestId("language-switcher")).toBeTruthy();
    expect(screen.getByTestId("theme-switcher")).toBeTruthy();
    const loginLink = screen.getByRole("link", { name: "Đăng nhập" });
    expect(loginLink).toBeTruthy();
    expect(loginLink.getAttribute("href")).toBe("/login");
  });
});
