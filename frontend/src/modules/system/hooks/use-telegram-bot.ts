"use client";

import { useQuery } from "@tanstack/react-query";

import { notificationKeys } from "../constants/query-keys";
import { telegramBotService } from "../services/telegram-bot.service";

/** @param enabled - Có quyền. @returns Bot Telegram của mình (null nếu chưa có). */
export function useTelegramBot(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.telegramBot(),
    queryFn: ({ signal }) => telegramBotService.get(signal),
    enabled,
  });
}
