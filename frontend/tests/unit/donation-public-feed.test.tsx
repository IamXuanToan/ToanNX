// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import commonEn from "@/messages/en.json";
import commonVi from "@/messages/vi.json";
import { DonationPublicFeed } from "@/modules/utilities/components/page/donation-public-feed";
import { UTILITIES_POLLING_MS } from "@/modules/utilities/constants/polling";
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

  it("tuân thủ chu kỳ polling 60s/120s theo tab đang mở và tạm dừng khi ẩn tab trình duyệt", async () => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"],
    });
    try {
      mockGetPublicLeaderboard.mockResolvedValue([
        {
          id: "lb-poll",
          donorTitle: "Khách ủng hộ",
          amount: 200000,
          hideAmount: false,
          giftLabel: "Cà phê",
          tier: "SILVER",
          tierExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
          message: "Cố lên",
          receivedAt: new Date().toISOString(),
        },
      ]);
      mockGetPublicFeed.mockResolvedValue([
        {
          id: "feed-poll",
          donorTitle: "Bạn dev",
          amount: 50000,
          hideAmount: false,
          giftType: "COFFEE",
          giftLabel: "1 ly cà phê",
          tier: "NORMAL",
          tierExpiresAt: null,
          message: "Chúc vui",
          receivedAt: new Date().toISOString(),
        },
      ]);

      renderFeed({ locale: "vi", pageId: "page-poll" });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
      });
      // Mount ban đầu tải cả hai một lần; tab Leaderboard đang mở -> Feed không poll ở mốc 60s
      expect(mockGetPublicLeaderboard).toHaveBeenCalledTimes(1);
      expect(mockGetPublicFeed).toHaveBeenCalledTimes(1);

      // Ở 60s: tab đang mở là Leaderboard -> cả Leaderboard (120s) lẫn Feed (đang ở tab ẩn) đều chưa poll
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });
      expect(mockGetPublicLeaderboard).toHaveBeenCalledTimes(1);
      expect(mockGetPublicFeed).toHaveBeenCalledTimes(1);

      // Đủ 120s: Leaderboard poll lần 2; Feed vẫn không poll khi đang ở tab Leaderboard
      await act(async () => {
        await vi.advanceTimersByTimeAsync(UTILITIES_POLLING_MS.donationLeaderboard - 60_000 + 100);
      });
      expect(mockGetPublicLeaderboard).toHaveBeenCalledTimes(2);
      expect(mockGetPublicFeed).toHaveBeenCalledTimes(1);

      // Chuyển sang tab Ủng hộ gần đây -> Feed bắt đầu poll theo chu kỳ 60s (không phải 20s)
      const recentTab = screen.getByRole("tab", { name: /Ủng hộ gần đây/i });
      fireEvent.mouseDown(recentTab);
      fireEvent.click(recentTab);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
      });
      const feedCallsAfterSwitch = mockGetPublicFeed.mock.calls.length;

      await act(async () => {
        await vi.advanceTimersByTimeAsync(20_000);
      });
      expect(mockGetPublicFeed).toHaveBeenCalledTimes(feedCallsAfterSwitch);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(UTILITIES_POLLING_MS.donationFeed - 20_000 + 100);
      });
      expect(mockGetPublicFeed).toHaveBeenCalledTimes(feedCallsAfterSwitch + 1);
      // Khi đang ở tab Ủng hộ gần đây, Leaderboard không còn tự poll nữa
      expect(mockGetPublicLeaderboard).toHaveBeenCalledTimes(2);

      // Ẩn tab trình duyệt -> dừng toàn bộ polling
      Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3 * 60_000);
      });
      expect(mockGetPublicFeed).toHaveBeenCalledTimes(feedCallsAfterSwitch + 1);
      expect(mockGetPublicLeaderboard).toHaveBeenCalledTimes(2);
    } finally {
      Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
      vi.useRealTimers();
    }
  });
});
