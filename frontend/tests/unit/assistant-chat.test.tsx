// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AssistantChat } from "@/modules/workspace/components/assistant/assistant-chat";

const mockChat = vi.fn().mockResolvedValue({
  conversationId: "conv-1",
  reply: "Hôm nay bạn có 2 nhắc việc.",
  modelUsed: "gemini-2.5-flash",
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
    senderName: "Assistant",
    content: "Hôm nay bạn có 2 nhắc việc.",
    toolCalls: [],
    toolCallId: "",
    modelUsed: "gemini-2.5-flash",
    tokensUsed: 120,
    containsPrivateData: true,
    isError: false,
    createdAt: "2026-11-26T10:00:00Z",
  },
});

const mockGetMessages = vi.fn().mockResolvedValue({
  items: [
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
  pagination: { page: 2, pageSize: 50, total: 55, totalPages: 2 },
});

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
  useFormatter: () => ({ dateTime: () => "10:00" }),
}));

vi.mock("@/modules/workspace/services/assistant.service", () => ({
  assistantService: { chat: (...args: unknown[]) => mockChat(...args) },
}));

vi.mock("@/modules/workspace/services/assistant-conversation.service", () => ({
  assistantConversationService: {
    list: vi.fn().mockResolvedValue({
      items: [
        {
          id: "conv-1",
          ownerId: "u1",
          ownerEmail: "u1@test.local",
          channel: "WEB",
          externalChatId: "",
          title: "Việc hôm nay",
          lastMessageAt: "2026-11-26T10:00:00Z",
          messageCount: 55,
          createdAt: "2026-11-26T08:00:00Z",
          updatedAt: "2026-11-26T10:00:00Z",
        },
      ],
      pagination: { page: 1, pageSize: 30, total: 1, totalPages: 1 },
    }),
    get: vi.fn().mockResolvedValue({
      id: "conv-1",
      ownerId: "u1",
      ownerEmail: "u1@test.local",
      channel: "WEB",
      externalChatId: "",
      title: "Việc hôm nay",
      lastMessageAt: "2026-11-26T10:00:00Z",
      messageCount: 55,
      hasMoreMessages: true,
      recentMessages: [
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
      ],
      createdAt: "2026-11-26T08:00:00Z",
      updatedAt: "2026-11-26T10:00:00Z",
    }),
    messages: (...args: unknown[]) => mockGetMessages(...args),
    delete: vi.fn(),
  },
}));

describe("AssistantChat (8 slash commands + tải thêm tin nhắn cũ)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("bấm slash /today gọi chat và hiển thị badge model; bấm hội thoại tải tin nhắn cũ", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <AssistantChat canChat canReadConversations canDeleteConversations />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: "slashCommands.today" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "slashCommands.upcoming" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "slashCommands.spending" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "slashCommands.assets" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "slashCommands.status" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "slashCommands.remind" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "slashCommands.newchat" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "slashCommands.help" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "slashCommands.today" }));
    await waitFor(() => {
      expect(mockChat).toHaveBeenCalledWith({ message: "/today", conversationId: null });
      expect(screen.getByText(/gemini-2.5-flash/)).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "loadMore" })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "loadMore" }));
    await waitFor(() => {
      expect(mockGetMessages).toHaveBeenCalledWith("conv-1", { page: 2, pageSize: 50 });
      expect(screen.getByText("Tin nhắn cũ hơn")).toBeTruthy();
    });
  });
});
