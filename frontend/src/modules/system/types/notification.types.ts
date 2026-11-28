import type { ListParams } from "@/shares/types/api.types";

export type NotificationScope = "PERSONAL" | "SYSTEM";
export type NotificationLevel = "INFO" | "WARNING" | "ERROR";
export type NotificationChannel = "IN_APP" | "PUSH" | "EMAIL" | "TELEGRAM";

/** Một thông báo trong chuông (BE `NotificationResponseSerializer`). */
export type AppNotification = {
  id: string;
  scope: NotificationScope;
  level: NotificationLevel;
  eventCode: string;
  module: string;
  title: string;
  body: string;
  messageKey: string;
  params: Record<string, string | number>;
  link: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type UnreadCount = { personal: number; system: number };

/** Sự kiện người dùng được nhận. */
export type NotificationEvent = {
  code: string;
  module: string;
  name: string;
  description: string;
  scope: NotificationScope;
  defaultLevel: NotificationLevel;
  defaultChannels: NotificationChannel[];
  kind: "business" | "technical";
};

export type NotificationPreferenceItem = {
  event: NotificationEvent;
  inApp: boolean;
  push: boolean;
  email: boolean;
  telegramChatIds: string[];
  inAppLocked: boolean;
};

export type NotificationPreferences = {
  channels: NotificationChannel[];
  items: NotificationPreferenceItem[];
};

export type NotificationPreferenceInput = {
  eventCode: string;
  inApp: boolean;
  push: boolean;
  email: boolean;
  telegramChatIds: string[];
};

export type PushDevice = {
  id: string;
  label: string;
  isActive: boolean;
  lastSeenAt: string | null;
  createdAt: string;
};

export type TelegramBot = {
  configured: boolean;
  username: string;
  displayName: string;
  botUrl: string;
};

export type TelegramBotCheck = {
  bot: TelegramBot;
  webhookActive: boolean;
  webhookUrl: string;
  lastErrorCode: string;
};

export type TelegramGroupReplyMode = "mention_only" | "all_messages";

export type TelegramChat = {
  id: string;
  chatId: string | null;
  title: string;
  chatType: string;
  status: "pending" | "active" | "unreachable" | "removed";
  isActive: boolean;
  groupReplyMode: TelegramGroupReplyMode;
  registrationExpiresAt: string | null;
  lastVerifiedAt: string | null;
  lastErrorCode: string;
};

export type TelegramRegistration = { chat: TelegramChat; code: string; link: string };

export type NotificationDelivery = {
  id: string;
  eventCode: string;
  title: string;
  level: NotificationLevel;
  recipientId: string;
  recipientName: string;
  channel: NotificationChannel;
  target: string;
  status: "PENDING" | "SENT" | "FAILED" | "SKIPPED";
  attempts: number;
  nextAttemptAt: string | null;
  lastErrorCode: string;
  sentAt: string | null;
  createdAt: string;
};

export type NotificationDeliveryFilters = ListParams & { status?: string; channel?: string };

export type SystemAnnouncement = {
  id: string;
  title: string;
  body: string;
  level: NotificationLevel;
  link: string;
  target: "ALL" | "ROLES";
  roleIds: string[];
  expiresAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  createdAt: string;
};

export type SystemAnnouncementInput = {
  title: string;
  body: string;
  level: NotificationLevel;
  link: string;
  target: "ALL" | "ROLES";
  roleIds: string[];
  expiresAt: string | null;
};
