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

describe("Form Nhắc việc dùng cấu hình kênh tại Hồ sơ → Thông báo", () => {
  it("không hiển thị chọn kênh Website/Telegram/Email khi tạo mới và không gửi notificationChannels", async () => {
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

    expect(screen.queryByRole("checkbox", { name: /Website/i })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: /Telegram/i })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: /Email/i })).toBeNull();
    expect(screen.queryByText(/Kênh nhận thông báo/i)).toBeNull();

    fireEvent.change(screen.getByLabelText(/Tiêu đề việc/), {
      target: { value: "Gia hạn tên miền" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => {
      expect(mockSaveReminder).toHaveBeenCalledTimes(1);
    });
    const submitted = mockSaveReminder.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(submitted).toMatchObject({ title: "Gia hạn tên miền" });
    expect("notificationChannels" in submitted).toBe(false);
  });
});
