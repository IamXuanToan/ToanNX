// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import commonVi from "@/messages/vi.json";
import { ShortLinkLandingCard } from "@/modules/utilities/components/short-link/short-link-landing-card";
import utilitiesVi from "@/modules/utilities/messages/vi.json";
import type { PublicShortLink } from "@/modules/utilities/types/short-link.types";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const SAMPLE_LINK: PublicShortLink = {
  name: "Link demo",
  description: "Mô tả demo",
  destinationUrl: "https://example.com/target",
  hasPassword: false,
  autoRedirectSeconds: 5,
};

describe("ShortLinkLandingCard", () => {
  it("cho phép bấm Tạm dừng và Tiếp tục bộ đếm ngược chuyển hướng", () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider
          locale="vi"
          timeZone="Asia/Ho_Chi_Minh"
          messages={{ ...commonVi, utilities: utilitiesVi }}
        >
          <ShortLinkLandingCard slug="demo" link={SAMPLE_LINK} />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Tự động chuyển tiếp sau 5 giây/)).toBeTruthy();

    // Đếm xuống 4 giây
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/Tự động chuyển tiếp sau 4 giây/)).toBeTruthy();

    // Bấm Tạm dừng -> giữ nguyên ở 4 giây dù thời gian trôi qua
    fireEvent.click(screen.getByTestId("short-link-pause-btn"));
    expect(screen.getByText(/Đã tạm dừng ở 4 giây/)).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText(/Đã tạm dừng ở 4 giây/)).toBeTruthy();

    // Bấm Tiếp tục -> đếm tiếp xuống 3 giây
    fireEvent.click(screen.getByTestId("short-link-pause-btn"));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/Tự động chuyển tiếp sau 3 giây/)).toBeTruthy();
  });
});
