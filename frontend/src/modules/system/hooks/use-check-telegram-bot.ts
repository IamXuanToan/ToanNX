"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { telegramBotService } from "../services/telegram-bot.service";

/** @returns Mutation kiểm tra bot. */
export function useCheckTelegramBot() {
  return useResourceMutation<void, { hasWebhook: boolean }>({
    mutationFn: () => telegramBotService.check(),
    invalidate: [notificationKeys.all],
    success: false,
  });
}
