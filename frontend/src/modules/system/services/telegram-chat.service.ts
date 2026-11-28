import { apiClient } from "@/shares/lib/api/api-client";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  TelegramChat,
  TelegramGroupReplyMode,
  TelegramRegistration,
} from "../types/notification.types";

/** Service nơi nhận Telegram của chính mình (BE `telegram_chat_service.py`). */
export const telegramChatService = {
  async list(signal?: AbortSignal): Promise<TelegramChat[]> {
    return (await apiClient.get<TelegramChat[]>(SYSTEM_API_ENDPOINTS.telegramChats, { signal }))
      .data;
  },

  async register(kind: "group" | "private"): Promise<TelegramRegistration> {
    return (
      await apiClient.post<TelegramRegistration>(SYSTEM_API_ENDPOINTS.telegramRegister, { kind })
    ).data;
  },

  async action(id: string, action: "verify" | "test"): Promise<TelegramChat> {
    return (await apiClient.post<TelegramChat>(SYSTEM_API_ENDPOINTS.telegramChatAction(id, action)))
      .data;
  },

  async update(
    id: string,
    payload: { isActive?: boolean; groupReplyMode?: TelegramGroupReplyMode },
  ): Promise<TelegramChat> {
    return (
      await apiClient.patch<TelegramChat>(`${SYSTEM_API_ENDPOINTS.telegramChats}/${id}`, payload)
    ).data;
  },

  async setActive(id: string, isActive: boolean): Promise<TelegramChat> {
    return telegramChatService.update(id, { isActive });
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${SYSTEM_API_ENDPOINTS.telegramChats}/${id}`);
  },
};
