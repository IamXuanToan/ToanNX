"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { telegramBotService } from "../services/telegram-bot.service";
import type { TelegramBotCheck } from "../types/notification.types";

/** @returns Mutation kiểm tra và đồng bộ webhook Bot Telegram chung. */
export function useCheckTelegramBot() {
  return useResourceMutation<void, TelegramBotCheck>({
    mutationFn: () => telegramBotService.check(),
    invalidate: [notificationKeys.all],
    success: false,
  });
}
