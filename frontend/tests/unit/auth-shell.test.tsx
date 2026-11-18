// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthShell } from "@/modules/auth/components/auth-shell/auth-shell";

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
  usePathname: () => "/login",
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      backToHome: "Về trang chủ",
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
    theme: "light",
    setTheme: vi.fn(),
  }),
}));

vi.mock("@/shares/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

afterEach(cleanup);

describe("AuthShell", () => {
  it("hiển thị nút Về trang chủ, các nút switcher và card nội dung", () => {
    render(
      <AuthShell homeHref="/" title="Đăng nhập" description="Nhập thông tin">
        <div data-testid="test-form">Form</div>
      </AuthShell>,
    );

    // 1. Nút Về trang chủ
    const backBtn = screen.getByRole("link", { name: /Về trang chủ/i });
    expect(backBtn).toBeTruthy();
    expect(backBtn.getAttribute("href")).toBe("/");

    // 2. LanguageSwitcher & ThemeSwitcher
    expect(screen.getByTestId("language-switcher")).toBeTruthy();
    expect(screen.getByTestId("theme-switcher")).toBeTruthy();

    // 3. Tiêu đề và mô tả
    expect(screen.getByText("Đăng nhập")).toBeTruthy();
    expect(screen.getByText("Nhập thông tin")).toBeTruthy();
    expect(screen.getByTestId("test-form")).toBeTruthy();
  });
});
