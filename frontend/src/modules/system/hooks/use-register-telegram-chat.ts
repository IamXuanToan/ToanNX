"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { telegramChatService } from "../services/telegram-chat.service";
import type { TelegramRegistration } from "../types/notification.types";

/** @returns Mutation tạo mã đăng ký. */
export function useRegisterTelegramChat() {
  return useResourceMutation<"group" | "private", TelegramRegistration>({
    mutationFn: (kind) => telegramChatService.register(kind),
    invalidate: [notificationKeys.all],
    success: false,
  });
}
