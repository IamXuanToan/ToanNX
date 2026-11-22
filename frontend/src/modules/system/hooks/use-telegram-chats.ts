"use client";

import { useQuery } from "@tanstack/react-query";

import { notificationKeys } from "../constants/query-keys";
import { telegramChatService } from "../services/telegram-chat.service";

/** @param enabled - Có quyền và đã có bot. @returns Nơi nhận Telegram của mình. */
export function useTelegramChats(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.chats(),
    queryFn: ({ signal }) => telegramChatService.list(signal),
    enabled,
  });
}
