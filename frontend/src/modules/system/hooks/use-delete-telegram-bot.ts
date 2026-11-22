"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { telegramBotService } from "../services/telegram-bot.service";

/** @returns Mutation xóa bot. */
export function useDeleteTelegramBot() {
  return useResourceMutation<void, void>({
    mutationFn: () => telegramBotService.remove(),
    invalidate: [notificationKeys.all],
    success: "deleted",
  });
}
