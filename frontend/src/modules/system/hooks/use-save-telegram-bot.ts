"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { telegramBotService } from "../services/telegram-bot.service";

/** @returns Mutation lưu token bot. */
export function useSaveTelegramBot() {
  return useResourceMutation<string, unknown>({
    mutationFn: (token) => telegramBotService.save(token),
    invalidate: [notificationKeys.all],
    success: "saved",
  });
}
