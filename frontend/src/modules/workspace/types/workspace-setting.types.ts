/** Cài đặt cá nhân: Múi giờ, Digest, mốc nhắc mặc định & Telegram nhận tin (khớp `WorkspaceSettingResponse`). */
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
  telegramOwnerUserId: number | null;
  telegramAllowedChatIds: string[];
  availableDigestSections: string[];
  telegramBotConfigured: boolean;
  telegramBotUsername: string;
  telegramBotUrl: string;
  createdAt: string;
  updatedAt: string;
};

/** Đầu vào cập nhật cài đặt cá nhân (`/workspace/settings`). */
export type WorkspaceSettingUpdateInput = {
  timezone?: string;
  dailyDigestEnabled?: boolean;
  digestTimeSlots?: string[];
  digestSections?: string[];
  warrantyAlertDays?: number[];
  subscriptionDefaultAlertDays?: number[];
  telegramAllowedChatIds?: string[];
};
