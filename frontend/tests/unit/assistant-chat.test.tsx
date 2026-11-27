// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import commonVi from "@/messages/vi.json";
import systemVi from "@/modules/system/messages/vi.json";
import { AssistantChat } from "@/modules/workspace/components/assistant/assistant-chat";
import workspaceVi from "@/modules/workspace/messages/vi.json";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockChat = vi.fn().mockResolvedValue({
  conversationId: "conv-1",
  reply: "Hôm nay bạn có 2 nhắc việc.",
  modelUsed: "cohere/command-a-plus",
  tokensUsed: 120,
  containsPrivateData: true,
  isFallback: false,
  fallbackAttempts: 1,
  fallbackCode: "",
  message: {
    id: "m-2",
    conversationId: "conv-1",
    role: "ASSISTANT",
    senderTelegramId: null,
    senderName: "ToanNX Bot",
    content: "Hôm nay bạn có 2 nhắc việc.",
    toolCalls: [],
    toolCallId: "",
    modelUsed: "cohere/command-a-plus",
    tokensUsed: 120,
    containsPrivateData: true,
    isError: false,
    createdAt: "2026-11-26T10:00:00Z",
  },
});

const mockGetThread = vi.fn().mockImplementation((params?: { page?: number }) => {
  if (params?.page === 2) {
    return Promise.resolve({
      messages: [
        {
          id: "m-old",
          conversationId: "conv-1",
          role: "USER",
          senderTelegramId: null,
          senderName: "User",
          content: "Tin nhắn cũ hơn",
          toolCalls: [],
          toolCallId: "",
          modelUsed: "",
          tokensUsed: 0,
          containsPrivateData: false,
          isError: false,
          createdAt: "2026-11-26T08:00:00Z",
        },
      ],
      hasMoreMessages: false,
      totalMessages: 2,
    });
  }
  return Promise.resolve({
    messages: [
      {
        id: "m-1",
        conversationId: "conv-1",
        role: "USER",
        senderTelegramId: null,
        senderName: "User",
        content: "/today",
        toolCalls: [],
        toolCallId: "",
        modelUsed: "",
        tokensUsed: 0,
        containsPrivateData: false,
        isError: false,
        createdAt: "2026-11-26T09:59:00Z",
      },
      {
        id: "m-2",
        conversationId: "conv-1",
        role: "ASSISTANT",
        senderTelegramId: null,
        senderName: "ToanNX Bot",
        content: "Hôm nay bạn có 2 nhắc việc.",
        toolCalls: [],
        toolCallId: "",
        modelUsed: "cohere/command-a-plus",
        tokensUsed: 120,
        containsPrivateData: true,
        isError: false,
        createdAt: "2026-11-26T10:00:00Z",
      },
    ],
    hasMoreMessages: true,
    totalMessages: 55,
  });
});

const mockClearThread = vi.fn().mockResolvedValue({ deletedCount: 2 });

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/modules/system/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    data: {
      user: { id: "u1", email: "u1@test.local", fullName: "Nguyễn Toàn", avatar: null },
    },
  }),
}));

vi.mock("@/modules/workspace/services/assistant.service", () => ({
  assistantService: { chat: (...args: unknown[]) => mockChat(...args) },
}));

vi.mock("@/modules/workspace/services/assistant-config.service", () => ({
  assistantConfigService: {
    getBotProfile: vi.fn().mockResolvedValue({
      name: "ToanNX Bot",
      avatar: null,
      activeModel: "cohere/command-a-plus",
      hasCustomPolicy: true,
    }),
    getThread: (...args: unknown[]) => mockGetThread(...args),
    clearThread: () => mockClearThread(),
  },
}));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AssistantChat (1 luồng chat shadcn + badge trường trộn + thinking indicator)", () => {
  it("hiển thị badge lệnh nhanh thân thiện, ẩn meta kỹ thuật, gợi ý / và trạng thái đang suy nghĩ", async () => {
    let resolveDelayedChat: ((value: unknown) => void) | undefined;
    mockChat.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDelayedChat = resolve;
        }),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <NextIntlClientProvider
          locale="vi"
          timeZone="Asia/Ho_Chi_Minh"
          messages={{ ...commonVi, system: systemVi, workspace: workspaceVi }}
        >
          <AssistantChat variant="page" canChat />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: "Hôm nay" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sắp tới" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chi tiêu" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Thiết bị" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Nhắc việc" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Trợ giúp" })).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Hôm nay bạn có 2 nhắc việc.")).toBeTruthy();
    });

    // Không hiển thị metadata kỹ thuật model/tokens/privateBadge lên khung chat
    expect(screen.queryByText("cohere/command-a-plus")).toBeNull();
    expect(screen.queryByText(/tokens/i)).toBeNull();
    expect(screen.queryByText("Có dữ liệu cá nhân")).toBeNull();

    // Tin nhắn user `/today` trong lịch sử được render thành badge trường trộn "Hôm nay"
    expect(screen.getAllByText("Hôm nay").length).toBeGreaterThanOrEqual(2);

    // Gõ `/` mở popover gợi ý câu lệnh kèm badge trường trộn
    const input = screen.getByRole("textbox");
    expect((input as HTMLInputElement).placeholder).toBe("Hỏi AI hoặc gõ /...");
    fireEvent.change(input, { target: { value: "/" } });
    expect(screen.getByTestId("assistant-slash-suggestions")).toBeTruthy();
    expect(screen.getByTestId("slash-option-today")).toBeTruthy();

    // Lọc nhanh theo `/nhac` -> chèn cú pháp `/nhac_viec ` khi nhấn Enter
    fireEvent.change(input, { target: { value: "/nhac" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect((input as HTMLInputElement).value).toBe("/nhac_viec ");
    expect(screen.queryByTestId("assistant-slash-suggestions")).toBeNull();

    // Bấm badge lệnh nhanh `Hôm nay` -> hiện `{botName} đang suy nghĩ` khi đang chờ
    fireEvent.click(screen.getByRole("button", { name: "Hôm nay" }));
    await waitFor(() => {
      expect(screen.getByTestId("assistant-thinking-indicator").textContent).toContain(
        "ToanNX Bot đang suy nghĩ",
      );
    });
    resolveDelayedChat?.({
      conversationId: "conv-1",
      reply: "Hôm nay bạn có 2 nhắc việc.",
      modelUsed: "cohere/command-a-plus",
      tokensUsed: 120,
      containsPrivateData: true,
      isFallback: false,
      fallbackAttempts: 1,
      fallbackCode: "",
      message: {
        id: "m-3",
        conversationId: "conv-1",
        role: "ASSISTANT",
        senderTelegramId: null,
        senderName: "ToanNX Bot",
        content: "Đã kiểm tra xong.",
        toolCalls: [],
        toolCallId: "",
        modelUsed: "cohere/command-a-plus",
        tokensUsed: 120,
        containsPrivateData: true,
        isError: false,
        createdAt: "2026-11-26T10:01:00Z",
      },
    });
    await waitFor(() => {
      expect(mockChat).toHaveBeenCalledWith({ message: "/hom_nay" });
      expect(screen.queryByTestId("assistant-thinking-indicator")).toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "Tải thêm tin nhắn cũ" }));
    await waitFor(() => {
      expect(mockGetThread).toHaveBeenCalledWith({ page: 2, pageSize: 50 });
      expect(screen.getByText("Tin nhắn cũ hơn")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("assistant-clear-thread-btn"));
    fireEvent.click(screen.getByTestId("confirm-dialog-confirm"));
    await waitFor(() => {
      expect(mockClearThread).toHaveBeenCalledTimes(1);
    });

    // Gõ `/xoa_lich_su` cũng xóa lịch sử trực tiếp không tốn LLM token
    fireEvent.change(input, { target: { value: "/xoa_lich_su" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(mockClearThread).toHaveBeenCalledTimes(2);
    });
    expect(mockChat).toHaveBeenCalledTimes(1);
  });

  it("render Markdown đẹp cho tin nhắn Trợ lý AI hợp lệ và giữ nguyên text thô cho user / lỗi", async () => {
    mockGetThread.mockResolvedValueOnce({
      messages: [
        {
          id: "u-plain",
          conversationId: "conv-1",
          role: "USER",
          senderTelegramId: null,
          senderName: "User",
          content: "Giữ **raw user text** nhé",
          toolCalls: [],
          toolCallId: "",
          modelUsed: "",
          tokensUsed: 0,
          containsPrivateData: false,
          isError: false,
          createdAt: "2026-11-26T09:58:00Z",
        },
        {
          id: "a-stub",
          conversationId: "conv-1",
          role: "ASSISTANT",
          senderTelegramId: null,
          senderName: "ToanNX Bot",
          content: "",
          toolCalls: [{ id: "call_1" }],
          toolCallId: "",
          modelUsed: "cohere/command-a-plus",
          tokensUsed: 0,
          containsPrivateData: true,
          isError: false,
          createdAt: "2026-11-26T09:58:30Z",
        },
        {
          id: "t-raw-json",
          conversationId: "conv-1",
          role: "TOOL",
          senderTelegramId: null,
          senderName: "",
          content: '{"ok": true, "scope": "today", "total_count": 0, "items": []}',
          toolCalls: [],
          toolCallId: "call_1",
          modelUsed: "cohere/command-a-plus",
          tokensUsed: 0,
          containsPrivateData: true,
          isError: false,
          createdAt: "2026-11-26T09:58:40Z",
        },
        {
          id: "a-md",
          conversationId: "conv-1",
          role: "ASSISTANT",
          senderTelegramId: null,
          senderName: "ToanNX Bot",
          content: "**Quản lý công việc:**\n- Tạo nhắc việc nhanh",
          toolCalls: [],
          toolCallId: "",
          modelUsed: "cohere/command-a-plus",
          tokensUsed: 90,
          containsPrivateData: false,
          isError: false,
          createdAt: "2026-11-26T09:59:00Z",
        },
        {
          id: "a-err",
          conversationId: "conv-1",
          role: "ASSISTANT",
          senderTelegramId: null,
          senderName: "ToanNX Bot",
          content: "Lỗi **kết nối**",
          toolCalls: [],
          toolCallId: "",
          modelUsed: "cohere/command-a-plus",
          tokensUsed: 0,
          containsPrivateData: false,
          isError: true,
          createdAt: "2026-11-26T10:00:00Z",
        },
      ],
      hasMoreMessages: false,
      totalMessages: 5,
    });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={client}>
        <NextIntlClientProvider
          locale="vi"
          timeZone="Asia/Ho_Chi_Minh"
          messages={{ ...commonVi, system: systemVi, workspace: workspaceVi }}
        >
          <AssistantChat variant="page" canChat />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Quản lý công việc:")).toBeTruthy();
    });

    expect(container.querySelector("strong")?.textContent).toBe("Quản lý công việc:");
    expect(container.querySelector("ul li")?.textContent?.trim()).toBe("Tạo nhắc việc nhanh");
    expect(screen.getByText("Giữ **raw user text** nhé")).toBeTruthy();
    expect(screen.getByText("Lỗi **kết nối**")).toBeTruthy();
    // Tuyệt đối không render JSON TOOL hay bong bóng stub rỗng lên giao diện
    expect(container.textContent).not.toContain('"total_count"');
    expect(container.querySelectorAll('[data-slot="message"]')).toHaveLength(3);
  });
});
