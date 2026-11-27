// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { WarrantyClaimForm } from "@/modules/workspace/components/asset-warranty-claim/warranty-claim-form";
import { AssetDetailView } from "@/modules/workspace/views/asset/asset-detail-view";
import { TooltipProvider } from "@/shares/components/ui/tooltip";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
});

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: unknown }) => (
    <a href={typeof href === "string" ? href : JSON.stringify(href)} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "vi",
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
  useFormatter: () => ({ dateTime: () => "2026-11-26" }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/portal/assets/asset-99",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("assetId=asset-99&tab=claims"),
}));

vi.mock("@/modules/system/hooks/use-permission", () => ({
  usePermission: () => true,
}));

vi.mock("@/modules/system/hooks/use-currency-options", () => ({
  useCurrencyOptions: () => ({
    data: [{ id: "cur-vnd", code: "VND", name: "Việt Nam Đồng", isBase: true, isActive: true }],
  }),
}));

vi.mock("@/modules/workspace/hooks/use-asset-options", () => ({
  useAssetOptions: () => ({
    options: [{ value: "asset-99", label: "MacBook Pro M3 (Apple)" }],
  }),
}));

vi.mock("@/modules/workspace/hooks/use-asset", () => ({
  useAsset: () => ({
    isPending: false,
    isError: false,
    data: {
      id: "asset-99",
      name: "MacBook Pro M3",
      brand: "Apple",
      modelCode: "M3",
      category: "LAPTOP",
      serialNumber: "SN1",
      imei: "",
      specs: {},
      status: "IN_USE",
      purchaseDate: "2026-01-10",
      purchasePrice: "45000000",
      currencyId: "cur-vnd",
      currencyCode: "VND",
      currencySymbol: "₫",
      currencyDecimalPlaces: 0,
      exchangeRate: "1",
      purchasePriceVnd: "45000000",
      purchaseStore: "TopZone",
      purchaseChannel: "RETAILER",
      purchaseBranchAddress: "",
      purchaseOrderCode: "",
      purchaseOrderUrl: "",
      storeWarrantyContact: "",
      warrantyType: "MANUFACTURER",
      warrantyMonths: 12,
      warrantyStartDate: "2026-01-10",
      warrantyEndDate: "2027-01-10",
      warrantyProvider: "Apple",
      warrantyNote: "",
      invoiceAttachments: [],
      notes: "",
      warrantyClaimCount: 1,
      repairCount: 0,
      totalClaimCount: 1,
      openClaimCount: 1,
      totalServiceCostVnd: "0",
      lastClaimDate: "2026-11-20",
      createdAt: "2026-01-10T00:00:00Z",
      updatedAt: "2026-11-20T00:00:00Z",
      ownerId: "u1",
      ownerEmail: "u1@test.local",
      ownerUsername: "u1",
      ownerName: "U1",
    },
  }),
}));

vi.mock("@/modules/workspace/hooks/use-warranty-claims", () => ({
  useWarrantyClaims: () => ({
    isPending: false,
    data: { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } },
  }),
}));

describe("AssetDetailView & WarrantyClaimForm (?assetId / ?tab)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("AssetDetailView tự kích hoạt tab claims theo ?tab=claims và có link tạo phiếu kèm assetId", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <AssetDetailView id="asset-99" />
        </TooltipProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/claimsSummary/)).toBeTruthy();
    });
    const newClaimLink = screen.getByRole("link", { name: "newClaim" });
    expect(newClaimLink.getAttribute("href")).toContain("asset-99");
  });

  it("WarrantyClaimForm điền sẵn thiết bị từ ?assetId=", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <WarrantyClaimForm />
        </TooltipProvider>
      </QueryClientProvider>,
    );

    expect(screen.getAllByText("MacBook Pro M3 (Apple)").length).toBeGreaterThan(0);
  });
});
