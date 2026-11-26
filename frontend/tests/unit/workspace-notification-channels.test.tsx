// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

import commonVi from "@/messages/vi.json";
import systemVi from "@/modules/system/messages/vi.json";
import { ReminderForm } from "@/modules/workspace/components/reminder/reminder-form";
import workspaceVi from "@/modules/workspace/messages/vi.json";

const mockSaveReminder = vi.fn().mockResolvedValue({ id: "rem-1" });

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
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/modules/workspace/services/reminder.service", () => ({
  reminderService: {
    create: (...args: unknown[]) => mockSaveReminder(...args),
    update: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("NotificationChannelsField trong Nhắc việc", () => {
  it("mặc định bật WEBSITE và cho phép bật thêm TELEGRAM, EMAIL khi lưu", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <NextIntlClientProvider
          locale="vi"
          messages={{ ...commonVi, system: systemVi, workspace: workspaceVi }}
        >
          <ReminderForm defaultDueDate="2026-12-01" />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );

    const webCheckbox = screen.getByRole("checkbox", { name: /Website/i });
    const tgCheckbox = screen.getByRole("checkbox", { name: /Telegram/i });
    const emailCheckbox = screen.getByRole("checkbox", { name: /Email/i });

    expect(webCheckbox.getAttribute("data-state")).toBe("checked");
    expect(tgCheckbox.getAttribute("data-state")).toBe("unchecked");
    expect(emailCheckbox.getAttribute("data-state")).toBe("unchecked");

    fireEvent.click(tgCheckbox);
    fireEvent.click(emailCheckbox);

    fireEvent.change(screen.getByLabelText(/Tiêu đề việc/), {
      target: { value: "Gia hạn tên miền" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => {
      expect(mockSaveReminder).toHaveBeenCalledTimes(1);
    });
    expect(mockSaveReminder.mock.calls[0]?.[0]).toMatchObject({
      title: "Gia hạn tên miền",
      notificationChannels: ["WEBSITE", "TELEGRAM", "EMAIL"],
    });
  });
});
