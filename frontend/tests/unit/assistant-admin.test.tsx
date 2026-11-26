// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import commonVi from "@/messages/vi.json";
import systemVi from "@/modules/system/messages/vi.json";
import { AssistantAdminPanel } from "@/modules/workspace/components/assistant/assistant-admin-panel";
import workspaceVi from "@/modules/workspace/messages/vi.json";

const SAMPLE_COMMANDS = vi.hoisted(() => [
  {
    canonical: "today",
    command: "/hom_nay",
    enCommand: "/today",
    syntax: "/hom_nay",
    enSyntax: "/today",
    description: "Xem việc cần làm & nhắc hẹn hôm nay",
    enDescription: "View today's tasks & reminders",
    telegramOnly: false,
  },
  {
    canonical: "verify_owner",
    command: "/xac_minh",
    enCommand: "/verify_owner",
    syntax: "/xac_minh",
    enSyntax: "/verify_owner",
    description: "Xác minh Telegram ID chính chủ (chat riêng với Bot)",
    enDescription: "Verify owner Telegram ID (DM only)",
    telegramOnly: true,
  },
]);

const mockUpdateConfig = vi.fn().mockResolvedValue({
  assistantName: "Admin Bot",
  assistantAvatar: null,
  assistantSystemPrompt: "Ngắn gọn",
  preferredAiModel: "gemini-2.5-flash",
  aiDailyTokenLimit: null,
  telegramAiEnabled: true,
  telegramGroupRequireMention: true,
  telegramGroupToolPolicy: "OWNER_ONLY",
  telegramGroupHideAmounts: false,
  telegramGroupReplyInDm: false,
  availableAiModels: ["cohere/command-a-plus", "gemini-2.5-flash"],
  telegramBotConfigured: true,
  telegramBotUsername: "ToanNXPlatformBot",
  telegramBotUrl: "https://t.me/ToanNXPlatformBot",
  telegramCommands: SAMPLE_COMMANDS,
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/workspace/assistant",
  useSearchParams: () => new URLSearchParams(),
}));

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
  usePathname: () => "/admin/workspace/assistant",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/modules/system/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    data: { user: { id: "a1", email: "admin@toannx.local", fullName: "Admin", avatar: null } },
  }),
}));

vi.mock("@/modules/workspace/services/assistant-config.service", () => ({
  assistantConfigService: {
    get: vi.fn().mockResolvedValue({
      assistantName: "ToanNX AI",
      assistantAvatar: null,
      assistantSystemPrompt: "",
      preferredAiModel: "",
      aiDailyTokenLimit: null,
      telegramAiEnabled: true,
      telegramGroupRequireMention: true,
      telegramGroupToolPolicy: "OWNER_ONLY",
      telegramGroupHideAmounts: false,
      telegramGroupReplyInDm: false,
      availableAiModels: ["cohere/command-a-plus", "gemini-2.5-flash"],
      telegramBotConfigured: true,
      telegramBotUsername: "ToanNXPlatformBot",
      telegramBotUrl: "https://t.me/ToanNXPlatformBot",
      telegramCommands: SAMPLE_COMMANDS,
    }),
    update: (...args: unknown[]) => mockUpdateConfig(...args),
    getBotProfile: vi.fn(),
    getThread: vi.fn(),
    clearThread: vi.fn(),
  },
}));

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
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [];
  };
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AssistantAdminPanel (FormPage chuẩn Admin & Lệnh BotFather Telegram)", () => {
  it("chọn preset Policy an toàn, lưu cấu hình và hiển thị danh sách command @BotFather", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <NextIntlClientProvider
          locale="vi"
          timeZone="Asia/Ho_Chi_Minh"
          messages={{ ...commonVi, system: systemVi, workspace: workspaceVi }}
        >
          <AssistantAdminPanel
            canReadConfig
            canUpdateConfig
            canReadAttachments
            canUploadAttachments
          />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );

    const nameInput = await screen.findByPlaceholderText(/ToanNX Assistant/);
    expect(screen.getByRole("link", { name: "Hủy" })).toBeTruthy();
    fireEvent.change(nameInput, { target: { value: "Admin Bot" } });
    fireEvent.click(screen.getByRole("button", { name: "Chuẩn an toàn hệ thống" }));
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdateConfig.mock.calls[0]?.[0]).toMatchObject({
      assistantName: "Admin Bot",
    });
    expect(mockUpdateConfig.mock.calls[0]?.[0].assistantSystemPrompt).toContain("khủng bố");
    expect(mockUpdateConfig.mock.calls[0]?.[0].assistantSystemPrompt).toContain("quân sự");
    expect(mockUpdateConfig.mock.calls[0]?.[0].assistantSystemPrompt).toContain(
      "phân biệt vùng miền",
    );

    expect(screen.getByTestId("admin-command-list")).toBeTruthy();
    expect(screen.getByTestId("botfather-commands-block").textContent).toContain(
      "hom_nay - Xem việc cần làm & nhắc hẹn hôm nay",
    );
    fireEvent.click(screen.getByTestId("copy-botfather-commands-btn"));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("hom_nay - Xem việc cần làm & nhắc hẹn hôm nay"),
      );
    });
  });
});
