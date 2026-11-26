import type { AttachmentVisibility } from "@/modules/system/types/attachment.types";

import type { TELEGRAM_GROUP_TOOL_POLICIES } from "../constants/defaults";

export type AssistantChannel = "WEB" | "TELEGRAM_DM" | "TELEGRAM_GROUP";
export type AssistantRole = "USER" | "ASSISTANT" | "TOOL" | "SYSTEM";
export type TelegramGroupToolPolicy = (typeof TELEGRAM_GROUP_TOOL_POLICIES)[number];

/** Tóm tắt ảnh công khai đính kèm (khớp `AttachmentSummaryResponse`). */
export type AssistantAvatarSummary = {
  id: string;
  url: string;
  visibility: AttachmentVisibility;
};

/** Một tin nhắn trong luồng chat Trợ lý AI (khớp `AssistantMessageResponse`). */
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

/** Thông tin nhận diện Bot AI tối giản cho nút tròn Portal (khớp `AssistantBotProfileResponse`). */
export type AssistantBotProfile = {
  name: string;
  avatar: AssistantAvatarSummary | null;
  activeModel: string;
  hasCustomPolicy: boolean;
};

/** Dữ liệu 1 luồng chat Web duy nhất (khớp `AssistantThreadResponse`). */
export type AssistantThread = {
  messages: AssistantMessage[];
  hasMoreMessages: boolean;
  totalMessages: number;
};

/** Kết quả dọn sạch luồng chat Web (khớp `AssistantThreadClearResponse`). */
export type AssistantThreadClearResult = {
  deletedCount: number;
};

/** Đầu mục 1 câu lệnh chuẩn để Admin cấu hình vào @BotFather (/setcommands) và đồng bộ giao diện chat. */
export type AssistantCommand = {
  canonical: string;
  command: string;
  enCommand: string;
  syntax: string;
  enSyntax: string;
  description: string;
  enDescription: string;
  telegramOnly: boolean;
};

/** Trọn bộ cấu hình Chatbot AI dùng chung trên màn Admin (khớp `AssistantConfigResponse`). */
export type AssistantConfig = {
  assistantName: string;
  assistantAvatar: AssistantAvatarSummary | null;
  assistantSystemPrompt: string;
  preferredAiModel: string;
  aiDailyTokenLimit: number | null;
  telegramAiEnabled: boolean;
  telegramGroupRequireMention: boolean;
  telegramGroupToolPolicy: TelegramGroupToolPolicy | string;
  telegramGroupHideAmounts: boolean;
  telegramGroupReplyInDm: boolean;
  availableAiModels: string[];
  telegramBotConfigured: boolean;
  telegramBotUsername: string;
  telegramBotUrl: string;
  telegramCommands: AssistantCommand[];
};

/** Đầu vào cập nhật cấu hình Chatbot AI trên màn Admin. */
export type AssistantConfigUpdateInput = {
  assistantName?: string;
  assistantAvatarId?: string | null;
  assistantSystemPrompt?: string;
  preferredAiModel?: string;
  aiDailyTokenLimit?: number | null;
  telegramAiEnabled?: boolean;
  telegramGroupRequireMention?: boolean;
  telegramGroupToolPolicy?: TelegramGroupToolPolicy;
  telegramGroupHideAmounts?: boolean;
  telegramGroupReplyInDm?: boolean;
};

/** Đầu vào gửi tin nhắn / slash command trong luồng chat Web duy nhất. */
export type AssistantChatInput = {
  message: string;
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
