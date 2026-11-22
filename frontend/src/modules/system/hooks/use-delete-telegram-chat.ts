"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { telegramChatService } from "../services/telegram-chat.service";

/** @returns Mutation xóa nơi nhận. */
export function useDeleteTelegramChat() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => telegramChatService.remove(id),
    invalidate: [notificationKeys.all],
    success: "deleted",
  });
}
