// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AUTH_WORKSPACE_PATHS, OAUTH_STORAGE_KEYS } from "@/modules/system/constants/auth-storage";
import { SocialAuthCallbackView } from "@/modules/system/views/auth/social-auth-callback-view";

const mockReplace = vi.fn();
const mockNextReplace = vi.fn();
const mockExchange = vi.fn();

// Mock router & navigation
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  usePathname: () => "/auth/callback/github",
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
}));

vi.mock("@/modules/system/hooks/use-social-auth-exchange", () => ({
  useSocialAuthExchange: () => ({
    exchange: (...args: unknown[]) => mockExchange(...args),
    sanitizeNext: (next: string | null) =>
      next && next.startsWith("/") && !next.startsWith("//") ? next : null,
  }),
}));

// Mock useSearchParams
let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    replace: mockNextReplace,
    push: vi.fn(),
  }),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
}));

// Mock Tooltip
vi.mock("@/shares/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock translations & locale
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    const messages: Record<string, string> = {
      callbackTitle: "Đang xác thực tài khoản",
      callbackProcessing: `Đang kết nối và xác minh với ${values?.provider || "nhà cung cấp"}...`,
      callbackProcessingWait: "Vui lòng giữ nguyên cửa sổ trình duyệt trong giây lát...",
      callbackSuccessTitle: "Đăng nhập thành công",
      callbackSuccessDesc: "Phiên đăng nhập an toàn đã được kích hoạt.",
      callbackRedirecting: "Đang chuyển hướng về không gian làm việc...",
      callbackRedirectNow: "Chuyển hướng ngay",
      callbackFailedTitle: "Xác thực thất bại",
      callbackFailedDesc: "Không thể hoàn tất quá trình xác thực với nhà cung cấp.",
      callbackFailed: "Xác thực không thành công",
      callbackNotLinkedTitle: "Chưa liên kết tài khoản",
      callbackNotLinkedDesc: `Tài khoản ${values?.provider || "này"} chưa được liên kết với bất kỳ người dùng nào trong hệ thống.`,
      callbackNotLinkedGuidance: "Vì lý do bảo mật, vui lòng đăng nhập bằng mật khẩu trước.",
      callbackBackToLogin: "Quay lại trang đăng nhập",
      callbackLoginWithPassword: "Đăng nhập bằng mật khẩu",
      callbackBackHome: "Về trang chủ",
      callbackCsrfFailed:
        "Phiên xác thực bảo mật không khớp hoặc đã hết hạn (CSRF Protection). Vui lòng thử lại.",
      backToHome: "Về trang chủ",
      label: "Ngôn ngữ",
      vi: "Tiếng Việt",
      en: "English",
      toggle: "Đổi giao diện",
    };
    return messages[key] ?? key;
  },
  useLocale: () => "vi",
}));

describe("SocialAuthCallbackView", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("chuyển người dùng không phải staff về Portal khi bấm Chuyển hướng ngay", async () => {
    sessionStorage.setItem(OAUTH_STORAGE_KEYS.state, "valid_state");
    mockSearchParams = new URLSearchParams("code=mock_code&state=valid_state");
    mockExchange.mockResolvedValue({ user: { isStaff: false, isSuperuser: false } });

    render(<SocialAuthCallbackView provider="github" />);

    const btn = await screen.findByRole("button", { name: "Chuyển hướng ngay" });
    fireEvent.click(btn);
    expect(mockReplace).toHaveBeenCalledWith(AUTH_WORKSPACE_PATHS.portal);
  });

  it("chuyển cả tài khoản Admin/Staff về Client Portal khi không có next", async () => {
    sessionStorage.setItem(OAUTH_STORAGE_KEYS.state, "valid_state");
    mockSearchParams = new URLSearchParams("code=mock_code&state=valid_state");
    mockExchange.mockResolvedValue({ user: { isStaff: true, isSuperuser: true } });

    render(<SocialAuthCallbackView provider="github" />);

    const btn = await screen.findByRole("button", { name: "Chuyển hướng ngay" });
    fireEvent.click(btn);
    expect(mockReplace).toHaveBeenCalledWith(AUTH_WORKSPACE_PATHS.portal);
  });

  it("dùng next/navigation replace khi next là đường dẫn có sẵn prefix ngôn ngữ", async () => {
    sessionStorage.setItem(OAUTH_STORAGE_KEYS.state, "valid_state");
    sessionStorage.setItem(OAUTH_STORAGE_KEYS.next, "/vi/quan-tri/tien-ich/quyen-gop");
    mockSearchParams = new URLSearchParams("code=mock_code&state=valid_state");
    mockExchange.mockResolvedValue({ user: { isStaff: true, isSuperuser: false } });

    render(<SocialAuthCallbackView provider="github" />);

    const btn = await screen.findByRole("button", { name: "Chuyển hướng ngay" });
    fireEvent.click(btn);
    expect(mockNextReplace).toHaveBeenCalledWith("/vi/quan-tri/tien-ich/quyen-gop");
  });

  it("hiển thị trạng thái lỗi CSRF khi thiếu hoặc lệch oauth_state", async () => {
    mockSearchParams = new URLSearchParams("code=mock_code&state=mismatch_state");
    sessionStorage.clear();

    render(<SocialAuthCallbackView provider="github" />);

    // Kiểm tra tiêu đề và mô tả không bị trùng lặp
    expect(screen.getByText("Xác thực thất bại")).toBeTruthy();
    expect(
      screen.getByText(
        "Phiên xác thực bảo mật không khớp hoặc đã hết hạn (CSRF Protection). Vui lòng thử lại.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Quay lại trang đăng nhập" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Về trang chủ" })).toHaveLength(2);
  });

  it("hiển thị trạng thái lỗi khi tham số URL trả về error từ nhà cung cấp", async () => {
    mockSearchParams = new URLSearchParams(
      "error=access_denied&error_description=User%20cancelled",
    );
    sessionStorage.clear();

    render(<SocialAuthCallbackView provider="github" />);

    expect(screen.getByText("Xác thực thất bại")).toBeTruthy();
    expect(screen.getByText("User cancelled")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Quay lại trang đăng nhập" })).toBeTruthy();
  });
});
