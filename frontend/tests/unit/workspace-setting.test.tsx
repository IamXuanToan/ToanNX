// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { WorkspaceSettingForm } from "@/modules/workspace/components/workspace-setting/workspace-setting-form";
import { PORTAL_ROUTES } from "@/modules/portal/constants/routes";
import { TooltipProvider } from "@/shares/components/ui/tooltip";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const mockUpdateSetting = vi.fn().mockResolvedValue({});

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
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/modules/system/hooks/use-permission", () => ({
  usePermission: () => true,
}));

vi.mock("@/modules/system/hooks/use-telegram-chats", () => ({
  useTelegramChats: () => ({
    data: [
      {
        id: "chat-uuid-1",
        chatId: "-100999",
        title: "DevOps Nhóm",
        chatType: "supergroup",
        status: "active",
        isActive: true,
        registrationExpiresAt: null,
        lastVerifiedAt: null,
        lastErrorCode: "",
      },
    ],
  }),
}));

vi.mock("@/modules/workspace/services/workspace-setting.service", () => ({
  workspaceSettingService: {
    get: vi.fn().mockResolvedValue({
      id: "ws-1",
      ownerId: "u1",
      ownerEmail: "u1@test.local",
      ownerName: "U1",
      ownerUsername: "u1",
      timezone: "Asia/Ho_Chi_Minh",
      dailyDigestEnabled: true,
      digestTimeSlots: ["08:00"],
      digestSections: ["reminders", "warranty"],
      warrantyAlertDays: [30, 7, 1],
      subscriptionDefaultAlertDays: [7, 3, 1],
      telegramOwnerUserId: 123456,
      telegramAllowedChatIds: ["chat-uuid-1"],
      availableDigestSections: ["reminders", "warranty", "subscriptions", "finance"],
      telegramBotConfigured: true,
      telegramBotUsername: "toannx_bot",
      telegramBotUrl: "https://t.me/toannx_bot",
      createdAt: "2026-11-26T00:00:00Z",
      updatedAt: "2026-11-26T00:00:00Z",
    }),
    update: (...args: unknown[]) => mockUpdateSetting(...args),
  },
}));

describe("WorkspaceSettingForm (Digest, Mốc cảnh báo & Telegram cá nhân)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("hiển thị Bot chung, nơi nhận Telegram và lưu cấu hình cá nhân đúng payload", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <WorkspaceSettingForm canUpdate />
        </TooltipProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/toannx_bot/)).toBeTruthy();
      expect(screen.getByText(/DevOps Nhóm/)).toBeTruthy();
    });

    // Có nút Quay lại điều hướng về dashboard Client Portal
    const backLink = screen.getByRole("link", { name: "back" });
    expect(backLink.getAttribute("href")).toBe(PORTAL_ROUTES.dashboard);

    // Không cho người dùng sửa AI Bot Avatar/Policy ở cài đặt cá nhân
    expect(screen.queryByText("fields.assistantSystemPrompt")).toBeNull();
    expect(screen.queryByText("fields.preferredAiModel")).toBeNull();

    // Thêm mốc ngày bảo hành bằng Enter trong ChipListInput
    const dayInput = screen.getAllByPlaceholderText("addAlertDayPlaceholder")[0];
    fireEvent.change(dayInput, { target: { value: "14" } });
    fireEvent.keyDown(dayInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => {
      expect(mockUpdateSetting).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdateSetting.mock.calls[0]?.[0]).toMatchObject({
      timezone: "Asia/Ho_Chi_Minh",
      digestTimeSlots: ["08:00"],
      digestSections: ["reminders", "warranty"],
      warrantyAlertDays: [30, 14, 7, 1],
      subscriptionDefaultAlertDays: [7, 3, 1],
      telegramAllowedChatIds: ["chat-uuid-1"],
    });
  });
});
