"use client";

import { useQuery } from "@tanstack/react-query";

import { notificationKeys } from "../constants/query-keys";
import { telegramBotService } from "../services/telegram-bot.service";

/** @param enabled - Kích hoạt query. @returns Metadata Bot Telegram dùng chung của hệ thống. */
export function useTelegramBot(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.telegramBot(),
    queryFn: ({ signal }) => telegramBotService.get(signal),
    enabled,
  });
}
