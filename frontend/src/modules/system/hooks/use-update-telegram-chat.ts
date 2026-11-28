"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { telegramChatService } from "../services/telegram-chat.service";
import type { TelegramChat, TelegramGroupReplyMode } from "../types/notification.types";

/** @returns Mutation cập nhật trạng thái hoặc chế độ trả lời nhóm Telegram. */
export function useUpdateTelegramChat() {
  return useResourceMutation<
    { id: string; isActive?: boolean; groupReplyMode?: TelegramGroupReplyMode },
    TelegramChat
  >({
    mutationFn: ({ id, ...payload }) => telegramChatService.update(id, payload),
    invalidate: [notificationKeys.all],
    success: "saved",
  });
}
