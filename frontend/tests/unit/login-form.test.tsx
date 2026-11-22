// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/modules/system/components/auth/login-form";

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
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      title: "Đăng nhập",
      subtitle: "Chào mừng bạn quay lại hệ thống quản trị ToanNX",
      identifier: "Email hoặc tên người dùng",
      identifierPlaceholder: "Nhập email hoặc tên người dùng",
      password: "Mật khẩu",
      passwordPlaceholder: "Nhập mật khẩu",
      forgotPasswordLink: "Quên mật khẩu?",
      orContinueWith: "Hoặc tiếp tục với",
      submit: "Đăng nhập",
      submitting: "Đang đăng nhập...",
      temporarilyDisabled: "Tạm ngưng",
      socialDisabledHint: "Phương thức đăng nhập này hiện đang tạm ngưng bảo trì.",
      required: "Trường này là bắt buộc.",
    };
    return map[key] ?? key;
  },
  useLocale: () => "vi",
}));

vi.mock("@/modules/system/hooks/use-public-settings", () => ({
  usePublicSettings: () => ({
    data: { authGoogleEnabled: true, authGithubEnabled: true },
  }),
}));

vi.mock("@/modules/system/hooks/use-login", () => ({
  useLogin: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
});

afterEach(cleanup);

describe("LoginForm", () => {
  it("hiển thị đầy đủ các nút mạng xã hội, các trường nhập liệu có icon và placeholder chuẩn", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LoginForm redirectTo="/admin" />
      </QueryClientProvider>,
    );

    // 1. Nút Google & GitHub
    expect(screen.getByTestId("login-google-button")).toBeTruthy();
    expect(screen.getByTestId("login-github-button")).toBeTruthy();

    // 2. Ô email/tên người dùng và mật khẩu
    const identifierInput = screen.getByPlaceholderText("Nhập email hoặc tên người dùng");
    expect(identifierInput).toBeTruthy();

    const passwordInput = screen.getByPlaceholderText("Nhập mật khẩu");
    expect(passwordInput).toBeTruthy();

    // 3. Link quên mật khẩu
    const forgotLink = screen.getByRole("link", { name: /Quên mật khẩu\?/i });
    expect(forgotLink).toBeTruthy();
    expect(forgotLink.getAttribute("href")).toBe("/forgot-password");

    // 4. Nút đăng nhập
    const submitBtn = screen.getByRole("button", { name: "Đăng nhập" });
    expect(submitBtn).toBeTruthy();
  });
});
