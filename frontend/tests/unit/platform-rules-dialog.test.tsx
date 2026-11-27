// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import commonVi from "@/messages/vi.json";
import financeVi from "@/modules/finance/messages/vi.json";
import { PlatformForm } from "@/modules/finance/components/platform/platform-form";
import systemVi from "@/modules/system/messages/vi.json";

const mockCreatePlatform = vi.fn().mockResolvedValue({
  id: "plat-new-1",
  name: "Shopee",
  code: "shopee",
  defaultCurrencyId: "cur-vnd",
});
const mockCreateRule = vi.fn().mockResolvedValue({
  id: "rule-1",
  name: "Shopee Payout",
  platformId: "plat-new-1",
  platformName: "Shopee",
  pattern: "SHOPEE",
  priority: 100,
  isActive: true,
});
const mockTestRule = vi.fn().mockResolvedValue({
  normalized: "NHAN TIEN SHOPEE PAYOUT",
  ruleId: null,
  ruleName: null,
  platformName: null,
  matchedText: "SHOPEE",
});

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
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/portal/finance/platforms/new",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/modules/system/hooks/use-currency-options", () => ({
  useCurrencyOptions: () => ({
    data: [{ id: "cur-vnd", code: "VND", name: "Việt Nam Đồng", isBase: true, isActive: true }],
  }),
}));

vi.mock("@/modules/finance/services/platform.service", () => ({
  platformService: {
    create: (...args: unknown[]) => mockCreatePlatform(...args),
    update: vi.fn(),
  },
}));

vi.mock("@/modules/finance/services/classification-rule.service", () => ({
  classificationRuleService: {
    list: vi.fn().mockResolvedValue({
      items: [],
      pagination: { total: 0, page: 1, pageSize: 100, totalPages: 1 },
    }),
    create: (...args: unknown[]) => mockCreateRule(...args),
    update: vi.fn(),
    delete: vi.fn(),
    test: (...args: unknown[]) => mockTestRule(...args),
  },
}));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PlatformForm + PlatformRulesDialog (+ shortcut)", () => {
  it("mở dialog quy tắc qua nút + hoặc phím tắt Alt+R, thêm quy tắc nháp & tự tạo khi lưu nền tảng mới", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <NextIntlClientProvider
          locale="vi"
          messages={{ ...commonVi, system: systemVi, finance: financeVi }}
        >
          <PlatformForm canReadRules canCreateRule canUpdateRule canDeleteRule />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );

    // Dùng phím tắt Alt+R mở nhanh popup quy tắc
    fireEvent.keyDown(window, { key: "r", altKey: true });
    const dialog = await screen.findByTestId("platform-rules-dialog");
    expect(dialog).toBeTruthy();

    // Thêm nhanh 1 quy tắc nháp
    fireEvent.click(within(dialog).getByTestId("add-rule-btn"));
    fireEvent.change(within(dialog).getByLabelText(/Tên/), { target: { value: "Shopee Payout" } });
    fireEvent.change(within(dialog).getByLabelText(/Regex/), { target: { value: "SHOPEE" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }));

    await waitFor(() => {
      expect(within(dialog).getByText("Shopee Payout")).toBeTruthy();
    });

    fireEvent.click(within(dialog).getByRole("button", { name: "Đóng" }));
    expect(screen.queryByTestId("platform-rules-dialog")).toBeNull();

    // Đã cập nhật badge số quy tắc chờ lưu
    expect(screen.getByText("1 quy tắc chờ lưu khi tạo")).toBeTruthy();
  });
});
