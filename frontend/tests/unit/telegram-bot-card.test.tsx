// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TelegramBotCard } from "@/modules/system/components/telegram-bot/telegram-bot-card";

const mockCheckAsync = vi.fn().mockResolvedValue({
  bot: {
    configured: true,
    username: "toannx_bot",
    displayName: "ToanNX Assistant",
    botUrl: "https://t.me/toannx_bot",
  },
  webhookActive: true,
  webhookUrl: "https://api.toannx.com/api/v1/system/telegram/webhook",
  lastErrorCode: "",
});

const mockUseTelegramBot = vi.fn(() => ({
  data: {
    configured: true,
    username: "toannx_bot",
    displayName: "ToanNX Assistant",
    botUrl: "https://t.me/toannx_bot",
  },
  isPending: false,
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
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn() },
}));

vi.mock("@/modules/system/hooks/use-telegram-bot", () => ({
  useTelegramBot: () => mockUseTelegramBot(),
}));

vi.mock("@/modules/system/hooks/use-check-telegram-bot", () => ({
  useCheckTelegramBot: () => ({ mutateAsync: mockCheckAsync, isPending: false }),
}));

describe("TelegramBotCard (1-bot ENV chung)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("hiển thị tên bot, link t.me và cho admin có setting.update bấm Kiểm tra webhook", async () => {
    render(<TelegramBotCard canCheck />);
    expect(screen.getByText(/ToanNX Assistant/)).toBeTruthy();
    expect(screen.getByText(/@toannx_bot/)).toBeTruthy();

    const link = screen.getByRole("link", { name: "openBot" });
    expect(link.getAttribute("href")).toBe("https://t.me/toannx_bot");

    const checkBtn = screen.getByRole("button", { name: "checkWebhook" });
    fireEvent.click(checkBtn);
    await waitFor(() => {
      expect(mockCheckAsync).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText("webhookActive")).toBeTruthy();
  });

  it("ẩn nút Kiểm tra webhook khi thành viên thường không có quyền setting.update", () => {
    render(<TelegramBotCard canCheck={false} />);
    expect(screen.getByRole("link", { name: "openBot" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "checkWebhook" })).toBeNull();
  });

  it("hiển thị trạng thái chưa cấu hình khi server chưa gắn TELEGRAM_BOT_TOKEN", () => {
    mockUseTelegramBot.mockReturnValueOnce({
      data: {
        configured: false,
        username: "",
        displayName: "",
        botUrl: "",
      },
      isPending: false,
    });
    render(<TelegramBotCard canCheck />);
    expect(screen.getByText("unconfiguredBadge")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "openBot" })).toBeNull();
    expect(screen.queryByRole("button", { name: "checkWebhook" })).toBeNull();
  });
});
