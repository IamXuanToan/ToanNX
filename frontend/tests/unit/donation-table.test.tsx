// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import commonEn from "@/messages/en.json";
import commonVi from "@/messages/vi.json";
import { DonationTable } from "@/modules/utilities/components/donation/donation-table";
import { DONATION_PERMISSIONS } from "@/modules/utilities/permissions/donation-permission";
import utilitiesEn from "@/modules/utilities/messages/en.json";
import utilitiesVi from "@/modules/utilities/messages/vi.json";
import { TooltipProvider } from "@/shares/components/ui/tooltip";

const mockUsePermission = vi.fn();
const mockDonationList = vi.fn();
let mockSearchParams = new URLSearchParams();

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
  usePathname: () => "/admin/utilities/donations",
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/modules/system/hooks/use-permission", () => ({
  usePermission: (permission: string) => mockUsePermission(permission),
}));

vi.mock("@/modules/utilities/services/donation.service", () => ({
  donationService: {
    list: (params: unknown, signal?: AbortSignal) => mockDonationList(params, signal),
    toggleHidden: vi.fn(),
    delete: vi.fn(),
    bulkUpdate: vi.fn(),
    bulkDelete: vi.fn(),
  },
}));

const SAMPLE_ITEMS = [
  {
    id: "don-1",
    pageId: "page-1",
    pageTitle: "Ủng hộ ToanNX",
    sepayId: "SP90001",
    amount: 500000,
    donorTitle: "Soái ca hào phóng",
    giftLabel: "1 ly cà phê",
    tier: "GOLD" as const,
    message: "Chúc dự án phát triển",
    originalContent: "donate 500k chuc du an",
    isCensored: false,
    isHidden: false,
    receivedAt: "2026-11-25T08:00:00Z",
    createdAt: "2026-11-25T08:00:00Z",
  },
];

function renderDonationTable(locale: "vi" | "en", canUpdate?: boolean) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mockDonationList.mockResolvedValue({
    items: SAMPLE_ITEMS,
    pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  });

  const messages =
    locale === "en"
      ? { ...commonEn, utilities: utilitiesEn }
      : { ...commonVi, utilities: utilitiesVi };

  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} timeZone="Asia/Ho_Chi_Minh" messages={messages}>
        <TooltipProvider>
          <DonationTable canUpdate={canUpdate} />
        </TooltipProvider>
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
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
  mockSearchParams = new URLSearchParams();
});

describe("DonationTable", () => {
  it("hiển thị nút Xuất báo cáo CSV tiếng Việt khi có quyền export và khóa switch khi mặc định canUpdate=false", async () => {
    mockUsePermission.mockImplementation((perm: string) => perm === DONATION_PERMISSIONS.export);
    renderDonationTable("vi");

    const exportButton = await screen.findByRole("button", { name: "Xuất báo cáo CSV" });
    expect(exportButton).toBeTruthy();

    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    fireEvent.click(exportButton);
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("/utilities/donations/export?"),
      "_blank",
      "noopener,noreferrer",
    );
    openSpy.mockRestore();

    expect(screen.queryByRole("switch")).toBeNull();
    expect(await screen.findByText("Hiển thị")).toBeTruthy();
    expect(await screen.findByText("Bảng Vàng")).toBeTruthy();
  });

  it("ẩn nút xuất CSV khi thiếu quyền export và hiển thị đúng tiếng Anh ở locale en", async () => {
    mockUsePermission.mockReturnValue(false);
    renderDonationTable("en", true);

    expect(await screen.findByText("Gold Tier")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Export CSV report" })).toBeNull();

    const rowSwitch = await screen.findByRole("switch");
    expect((rowSwitch as HTMLButtonElement).disabled).toBe(false);
  });

  it("truyền đầy đủ bộ lọc nhiều giá trị và tham số search/status sang list và export", async () => {
    mockSearchParams = new URLSearchParams("tier=GOLD,SILVER&status=hidden&search=demo");
    mockUsePermission.mockImplementation((perm: string) => perm === DONATION_PERMISSIONS.export);
    renderDonationTable("vi");

    const exportButton = await screen.findByRole("button", { name: "Xuất báo cáo CSV" });
    expect(mockDonationList).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "demo",
        tier: ["GOLD", "SILVER"],
        isHidden: true,
      }),
      expect.any(AbortSignal),
    );

    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    fireEvent.click(exportButton);
    const exportedUrl = openSpy.mock.calls[0]?.[0] as string;
    expect(exportedUrl).toContain("tier=GOLD%2CSILVER");
    expect(exportedUrl).toContain("search=demo");
    expect(exportedUrl).toContain("is_hidden=true");
    openSpy.mockRestore();
  });
});
