import type { ListParams } from "@/shares/types/api.types";

export type AssistantChannel = "WEB" | "TELEGRAM_DM" | "TELEGRAM_GROUP";
export type AssistantRole = "USER" | "ASSISTANT" | "TOOL" | "SYSTEM";

/** Một tin nhắn trong hội thoại Trợ lý AI (khớp `AssistantMessageResponse`). */
export type AssistantMessage = {
  id: string;
  conversationId: string;
  role: AssistantRole;
  senderTelegramId: number | null;
  senderName: string;
  content: string;
  toolCalls: unknown;
  toolCallId: string;
  modelUsed: string;
  tokensUsed: number;
  containsPrivateData: boolean;
  isError: boolean;
  createdAt: string;
};

/** Hội thoại Trợ lý AI trong danh sách (khớp `AssistantConversationListResponse`). */
export type AssistantConversation = {
  id: string;
  ownerId: string;
  ownerEmail: string;
  channel: AssistantChannel;
  externalChatId: string;
  title: string;
  lastMessageAt: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

/** Chi tiết hội thoại Trợ lý AI kèm 50 tin nhắn gần nhất (khớp `AssistantConversationDetailResponse`). */
export type AssistantConversationDetail = AssistantConversation & {
  recentMessages: AssistantMessage[];
  hasMoreMessages: boolean;
};

/** Đầu vào gửi tin nhắn / slash command cho Trợ lý AI. */
export type AssistantChatInput = {
  message: string;
  conversationId?: string | null;
};

/** Phản hồi sau một lượt chat với Trợ lý AI (khớp `AssistantChatResponse`). */
export type AssistantChatResult = {
  conversationId: string;
  reply: string;
  modelUsed: string;
  tokensUsed: number;
  containsPrivateData: boolean;
  isFallback: boolean;
  fallbackAttempts: number;
  fallbackCode: string;
  message: AssistantMessage;
};

/** Bộ lọc danh sách hội thoại Trợ lý AI. */
export type AssistantConversationFilters = ListParams & {
  channel?: readonly string[];
  owner?: string;
};
