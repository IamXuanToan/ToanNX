import type { TELEGRAM_GROUP_TOOL_POLICIES } from "../constants/defaults";

export type TelegramGroupToolPolicy = (typeof TELEGRAM_GROUP_TOOL_POLICIES)[number];

/** Cài đặt Workspace, Digest, AI & Telegram hai chiều (khớp `WorkspaceSettingResponse`). */
export type WorkspaceSetting = {
  id: string;
  ownerId: string;
  ownerEmail: string;
  timezone: string;
  dailyDigestEnabled: boolean;
  digestTimeSlots: string[];
  digestSections: string[];
  warrantyAlertDays: number[];
  subscriptionDefaultAlertDays: number[];
  preferredAiModel: string;
  aiDailyTokenLimit: number | null;
  telegramAiEnabled: boolean;
  telegramOwnerUserId: number | null;
  telegramAllowedChatIds: string[];
  telegramGroupRequireMention: boolean;
  telegramGroupToolPolicy: TelegramGroupToolPolicy;
  telegramGroupHideAmounts: boolean;
  telegramGroupReplyInDm: boolean;
  availableAiModels: string[];
  availableDigestSections: string[];
  telegramBotConfigured: boolean;
  telegramBotUsername: string;
  telegramBotUrl: string;
  createdAt: string;
  updatedAt: string;
};

/** Đầu vào cập nhật cài đặt Workspace. */
export type WorkspaceSettingUpdateInput = {
  timezone?: string;
  dailyDigestEnabled?: boolean;
  digestTimeSlots?: string[];
  digestSections?: string[];
  warrantyAlertDays?: number[];
  subscriptionDefaultAlertDays?: number[];
  preferredAiModel?: string;
  aiDailyTokenLimit?: number | null;
  telegramAiEnabled?: boolean;
  telegramAllowedChatIds?: string[];
  telegramGroupRequireMention?: boolean;
  telegramGroupToolPolicy?: TelegramGroupToolPolicy;
  telegramGroupHideAmounts?: boolean;
  telegramGroupReplyInDm?: boolean;
};
