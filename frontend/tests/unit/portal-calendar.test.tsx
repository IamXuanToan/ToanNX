// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

import { PortalCalendar } from "@/modules/workspace/components/calendar/portal-calendar";

const mockCalendarGet = vi.fn().mockResolvedValue({
  timezone: "Asia/Ho_Chi_Minh",
  fromDate: "2026-10-26",
  toDate: "2026-12-06",
  events: [
    {
      id: "rem:1",
      sourceId: "rem-1",
      type: "reminder",
      date: "2026-11-26",
      time: "09:00",
      title: "Kiểm tra SSL Server",
      subtitle: "HIGH",
      status: "HIGH",
      amountVnd: null,
      isCompleted: false,
      link: "/ca-nhan/nhac-viec/rem-1",
    },
    {
      id: "sub:1",
      sourceId: "sub-1",
      type: "subscription",
      date: "2026-11-26",
      time: "",
      title: "Gia hạn VPS",
      subtitle: "Hetzner",
      status: "MONTHLY",
      amountVnd: "250000",
      isCompleted: false,
      link: "/ca-nhan/dich-vu/sub-1",
    },
  ],
});

const mockReminderUpdate = vi.fn().mockResolvedValue({});

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={typeof href === "string" ? href : "/mock"} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "vi",
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
  useFormatter: () => ({ dateTime: (d: Date) => d.toISOString().slice(0, 10) }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("month=2026-11&date=2026-11-26"),
}));

vi.mock("@/modules/workspace/services/workspace-calendar.service", () => ({
  workspaceCalendarService: {
    get: (...args: unknown[]) => mockCalendarGet(...args),
  },
}));

vi.mock("@/modules/workspace/services/reminder.service", () => ({
  reminderService: {
    update: (...args: unknown[]) => mockReminderUpdate(...args),
    create: vi.fn().mockResolvedValue({ id: "rem-2" }),
  },
}));

describe("PortalCalendar", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("hiển thị sự kiện trong ngày, đồng bộ URL replaceState khi đổi filter và đánh dấu hoàn thành reminder", async () => {
    const replaceSpy = vi.spyOn(window.history, "replaceState");
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <PortalCalendar canReadCalendar canCreateReminder canUpdateReminder />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Kiểm tra SSL Server")).toBeTruthy();
      expect(screen.getByText("Gia hạn VPS")).toBeTruthy();
    });

    // Tắt bộ lọc subscription -> đồng bộ ?types= lên URL
    fireEvent.click(screen.getByRole("button", { name: "types.subscription" }));
    expect(replaceSpy).toHaveBeenCalled();
    expect(replaceSpy.mock.calls.at(-1)?.[2]).toContain("types=");

    // Đánh dấu hoàn thành reminder trực tiếp
    fireEvent.click(screen.getByRole("button", { name: "markDone" }));
    await waitFor(() => {
      expect(mockReminderUpdate).toHaveBeenCalledWith("rem-1", { isCompleted: true });
    });

    // Mở FormDialog tạo nhắc việc nhanh (chứa ReminderForm đầy đủ)
    fireEvent.click(screen.getByRole("button", { name: "quickAddReminder" }));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
      expect(screen.getByText("fields.title")).toBeTruthy();
    });
  });
});
