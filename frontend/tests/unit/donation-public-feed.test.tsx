// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import commonEn from "@/messages/en.json";
import commonVi from "@/messages/vi.json";
import { DonationPublicFeed } from "@/modules/utilities/components/page/donation-public-feed";
import utilitiesEn from "@/modules/utilities/messages/en.json";
import utilitiesVi from "@/modules/utilities/messages/vi.json";

const mockGetPublicFeed = vi.fn();
const mockGetPublicLeaderboard = vi.fn();

vi.mock("@/modules/utilities/services/donation.service", () => ({
  donationService: {
    getPublicFeed: (...args: unknown[]) => mockGetPublicFeed(...args),
    getPublicLeaderboard: (...args: unknown[]) => mockGetPublicLeaderboard(...args),
  },
}));

function renderFeed({
  locale = "vi",
  pageId = "page-1",
  preview = false,
  hideAmount = false,
}: {
  locale?: "vi" | "en";
  pageId?: string;
  preview?: boolean;
  hideAmount?: boolean;
}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const messages =
    locale === "en"
      ? { ...commonEn, utilities: utilitiesEn }
      : { ...commonVi, utilities: utilitiesVi };

  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} timeZone="Asia/Ho_Chi_Minh" messages={messages}>
        <DonationPublicFeed pageId={pageId} preview={preview} hideAmount={hideAmount} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

beforeAll(() => {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DonationPublicFeed", () => {
  it("không hiển thị thanh ticker Tri ân nhưng giữ nguyên Bảng Vinh danh và tab Ủng hộ gần đây với dữ liệu thật", async () => {
    mockGetPublicLeaderboard.mockResolvedValue([
      {
        id: "lb-1",
        donorTitle: "Anh chị em đẹp zai xinh gái",
        amount: 200000,
        hideAmount: false,
        giftLabel: "Bữa sáng no nê",
        tier: "SILVER",
        tierExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        message: "Mời bạn bữa sáng xôi thịt no nê",
        receivedAt: new Date().toISOString(),
      },
    ]);
    mockGetPublicFeed.mockResolvedValue([
      {
        id: "feed-1",
        donorTitle: "Bạn dev ẩn danh",
        amount: 50000,
        hideAmount: false,
        giftType: "COFFEE",
        giftLabel: "1 ly cà phê muối",
        tier: "NORMAL",
        tierExpiresAt: null,
        message: "Chúc code mượt mà",
        receivedAt: new Date().toISOString(),
      },
    ]);

    renderFeed({ locale: "vi", pageId: "page-real" });

    expect(await screen.findByText("Anh chị em đẹp zai xinh gái")).toBeTruthy();
    expect(screen.queryByText(/Tri ân/i)).toBeNull();
    expect(screen.getByRole("tab", { name: /Bảng Vinh danh/i })).toBeTruthy();

    const recentTab = screen.getByRole("tab", { name: /Ủng hộ gần đây/i });
    expect(recentTab).toBeTruthy();
    fireEvent.mouseDown(recentTab);
    fireEvent.click(recentTab);
    expect(await screen.findByText("Bạn dev ẩn danh")).toBeTruthy();
  });

  it("không hiển thị thanh ticker Thanks ở chế độ xem trước locale en nhưng giữ Leaderboard", async () => {
    mockGetPublicLeaderboard.mockResolvedValue([]);
    mockGetPublicFeed.mockResolvedValue([]);

    renderFeed({ locale: "en", pageId: "", preview: true });

    expect(await screen.findByText("Generous Patron")).toBeTruthy();
    expect(screen.queryByText(/Thanks:/i)).toBeNull();
    expect(screen.getByRole("tab", { name: /Leaderboard/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Recent Donations/i })).toBeTruthy();
  });
});
