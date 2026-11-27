import { apiClient } from "@/shares/lib/api/api-client";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { TelegramBot, TelegramBotCheck } from "../types/notification.types";

/** Service đọc metadata Bot Telegram dùng chung của hệ thống và kiểm tra webhook. */
export const telegramBotService = {
  async get(signal?: AbortSignal): Promise<TelegramBot> {
    return (await apiClient.get<TelegramBot>(SYSTEM_API_ENDPOINTS.telegramBot, { signal })).data;
  },

  async check(): Promise<TelegramBotCheck> {
    return (await apiClient.post<TelegramBotCheck>(SYSTEM_API_ENDPOINTS.telegramBotCheck)).data;
  },
};
