// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/modules/system/components/auth/login-form";

const mockReplace = vi.fn();
const mockMutateAsync = vi.fn();

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
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  mockReplace.mockReset();
  mockMutateAsync.mockReset();
});

afterEach(cleanup);

describe("LoginForm", () => {
  it("hiển thị đầy đủ các nút mạng xã hội, các trường nhập liệu có icon và placeholder chuẩn", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LoginForm redirectTo="/portal" />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId("login-google-button")).toBeTruthy();
    expect(screen.getByTestId("login-github-button")).toBeTruthy();
    expect(screen.getByPlaceholderText("Nhập email hoặc tên người dùng")).toBeTruthy();
    expect(screen.getByPlaceholderText("Nhập mật khẩu")).toBeTruthy();

    const forgotLink = screen.getByRole("link", { name: /Quên mật khẩu\?/i });
    expect(forgotLink).toBeTruthy();
    expect(forgotLink.getAttribute("href")).toBe("/forgot-password");

    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeTruthy();
  });

  it("luôn điều hướng về Client Portal kể cả khi tài khoản là Admin/Superuser", async () => {
    mockMutateAsync.mockResolvedValue({
      user: { isStaff: true, isSuperuser: true },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LoginForm redirectTo="/portal" />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText("Nhập email hoặc tên người dùng"), {
      target: { value: "admin@toannx.local" },
    });
    fireEvent.change(screen.getByPlaceholderText("Nhập mật khẩu"), {
      target: { value: "StrongPassword123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/portal");
    });
  });
});
