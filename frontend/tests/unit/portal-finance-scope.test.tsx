// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useFinanceDashboard } from "@/modules/finance/components/dashboard/hooks/use-finance-dashboard";
import { useIncomeTable } from "@/modules/finance/components/income/hooks/use-income-table";
import { useOwnerFilterOptions } from "@/modules/finance/hooks/use-owner-filter-options";

let mockPathname = "/portal/finance";
let mockUserId: string | null = "user-personal-1";

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("owner=other-user-99"),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({ dateTime: () => "Th1" }),
}));

vi.mock("@/modules/system/hooks/use-current-user", () => ({
  useCurrentUser: () =>
    mockUserId
      ? {
          data: {
            user: { id: mockUserId, email: "me@toannx.com", isSuperuser: true },
            roles: [],
            permissions: [],
          },
        }
      : { data: undefined },
}));

vi.mock("@/modules/system/hooks/use-permission", () => ({
  usePermission: () => true,
}));

const listIncomesSpy = vi.fn().mockResolvedValue({
  items: [],
  pagination: { total: 0, page: 1, pageSize: 20, totalPages: 1 },
});
const monthlySpy = vi.fn().mockResolvedValue({ months: [], previousMonths: [], byPlatform: [] });
const summarySpy = vi.fn().mockResolvedValue({ byPlatform: [], byCurrency: [], byMonth: [] });

vi.mock("@/modules/finance/services/income.service", () => ({
  incomeService: {
    list: (...args: unknown[]) => listIncomesSpy(...args),
  },
}));

vi.mock("@/modules/finance/services/finance-report.service", () => ({
  financeReportService: {
    monthly: (...args: unknown[]) => monthlySpy(...args),
    summary: (...args: unknown[]) => summarySpy(...args),
  },
}));

vi.mock("@/modules/finance/services/platform.service", () => ({
  platformService: {
    listAll: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/modules/system/services/user.service", () => ({
  userService: {
    listAll: vi.fn().mockResolvedValue([]),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("Phạm vi cá nhân của Tài chính trong Client Portal", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockPathname = "/portal/finance";
    mockUserId = "user-personal-1";
  });

  it("ẩn lọc người dùng và khóa dashboard theo currentUser.id dù có quyền manage_all", async () => {
    const { result } = renderHook(() => useFinanceDashboard(), { wrapper });
    expect(result.current.canFilterOwner).toBe(false);
    expect(result.current.owner).toEqual([]);

    await waitFor(() => {
      expect(monthlySpy).toHaveBeenCalledWith(
        expect.any(Number),
        "user-personal-1",
        expect.anything(),
      );
      expect(summarySpy).toHaveBeenCalledWith(
        expect.any(Number),
        null,
        "user-personal-1",
        expect.anything(),
      );
    });
  });

  it("không gửi request thu nhập khi chưa có user.id trong Portal và bỏ qua ?owner trên URL", async () => {
    mockUserId = null;
    const { result, rerender } = renderHook(() => useIncomeTable(), { wrapper });
    expect(result.current.canFilterOwner).toBe(false);
    expect(result.current.canManageAll).toBe(false);
    expect(listIncomesSpy).not.toHaveBeenCalled();

    mockUserId = "user-personal-1";
    rerender();

    await waitFor(() => {
      expect(listIncomesSpy).toHaveBeenCalledWith(
        expect.objectContaining({ owner: "user-personal-1" }),
        expect.anything(),
      );
    });
  });

  it("giữ nguyên quyền lọc người dùng ở màn Admin", () => {
    mockPathname = "/admin/finance";
    const { result } = renderHook(() => useOwnerFilterOptions("finance.income.manage_all"), {
      wrapper,
    });
    expect(result.current.isPortal).toBe(false);
    expect(result.current.canFilterOwner).toBe(true);
    expect(result.current.canManageAll).toBe(true);
    expect(result.current.personalOwnerId).toBeNull();
  });
});
