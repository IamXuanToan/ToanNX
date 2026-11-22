import { apiClient } from "@/shares/lib/api/api-client";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { TelegramBot } from "../types/notification.types";

/** Service bot Telegram của chính mình (BE `telegram_bot_service.py`); token chỉ ghi. */
export const telegramBotService = {
  async get(signal?: AbortSignal): Promise<TelegramBot | null> {
    return (await apiClient.get<TelegramBot | null>(SYSTEM_API_ENDPOINTS.telegramBot, { signal }))
      .data;
  },

  async save(token: string): Promise<TelegramBot> {
    return (await apiClient.put<TelegramBot>(SYSTEM_API_ENDPOINTS.telegramBot, { token })).data;
  },

  async check(): Promise<{ bot: TelegramBot; hasWebhook: boolean }> {
    return (
      await apiClient.post<{ bot: TelegramBot; hasWebhook: boolean }>(
        SYSTEM_API_ENDPOINTS.telegramBotCheck,
      )
    ).data;
  },

  async remove(): Promise<void> {
    await apiClient.delete(SYSTEM_API_ENDPOINTS.telegramBot);
  },
};
