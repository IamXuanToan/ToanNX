"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { telegramChatService } from "../services/telegram-chat.service";

/** @returns Mutation xác minh / gửi thử. */
export function useTelegramChatAction() {
  return useResourceMutation<{ id: string; action: "verify" | "test" }, unknown>({
    mutationFn: ({ id, action }) => telegramChatService.action(id, action),
    invalidate: [notificationKeys.all],
    success: "saved",
  });
}
