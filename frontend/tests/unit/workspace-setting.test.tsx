// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { WorkspaceSettingForm } from "@/modules/workspace/components/workspace-setting/workspace-setting-form";
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
      timezone: "Asia/Ho_Chi_Minh",
      dailyDigestEnabled: true,
      digestTimeSlots: ["08:00"],
      digestSections: ["reminders", "monitors"],
      warrantyAlertDays: [30, 7, 1],
      subscriptionDefaultAlertDays: [7, 3, 1],
      preferredAiModel: "",
      aiDailyTokenLimit: null,
      telegramAiEnabled: true,
      telegramOwnerUserId: 123456,
      telegramAllowedChatIds: ["chat-uuid-1"],
      telegramGroupRequireMention: true,
      telegramGroupToolPolicy: "OWNER_ONLY",
      telegramGroupHideAmounts: true,
      telegramGroupReplyInDm: false,
      availableAiModels: ["gemini-2.5-flash", "gpt-4o-mini"],
      availableDigestSections: ["reminders", "warranty", "subscriptions", "monitors", "finance"],
      telegramBotConfigured: true,
      telegramBotUsername: "toannx_bot",
      telegramBotUrl: "https://t.me/toannx_bot",
      createdAt: "2026-11-26T00:00:00Z",
      updatedAt: "2026-11-26T00:00:00Z",
    }),
    update: (...args: unknown[]) => mockUpdateSetting(...args),
  },
}));

describe("WorkspaceSettingForm (Digest, AI model, Telegram 2 chiều)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("hiển thị Bot chung, nơi nhận Telegram và lưu cấu hình đúng payload", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => {
      expect(mockUpdateSetting).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdateSetting.mock.calls[0]?.[0]).toMatchObject({
      timezone: "Asia/Ho_Chi_Minh",
      digestTimeSlots: ["08:00"],
      telegramAiEnabled: true,
      telegramAllowedChatIds: ["chat-uuid-1"],
      telegramGroupHideAmounts: true,
    });
  });
});
