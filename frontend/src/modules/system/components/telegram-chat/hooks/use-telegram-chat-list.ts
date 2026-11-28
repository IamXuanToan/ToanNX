"use client";

import { useState } from "react";

import { useDeleteTelegramChat } from "../../../hooks/use-delete-telegram-chat";
import { useRegisterTelegramChat } from "../../../hooks/use-register-telegram-chat";
import { useTelegramChatAction } from "../../../hooks/use-telegram-chat-action";
import { useTelegramChats } from "../../../hooks/use-telegram-chats";
import { useUpdateTelegramChat } from "../../../hooks/use-update-telegram-chat";
import type {
  TelegramGroupReplyMode,
  TelegramRegistration,
} from "../../../types/notification.types";

/** @param enabled - Đã có bot. @returns Chat, mã đăng ký đang chờ, handler. */
export function useTelegramChatList(enabled: boolean) {
  const chats = useTelegramChats(enabled);
  const register = useRegisterTelegramChat();
  const action = useTelegramChatAction();
  const update = useUpdateTelegramChat();
  const remove = useDeleteTelegramChat();
  const [pending, setPending] = useState<TelegramRegistration | null>(null);
  return {
    chats,
    pending,
    start: async (kind: "group" | "private") => setPending(await register.mutateAsync(kind)),
    verify: async () => {
      if (!pending) return;
      await action.mutateAsync({ id: pending.chat.id, action: "verify" });
      setPending(null);
    },
    test: (id: string) => action.mutate({ id, action: "test" }),
    setGroupReplyMode: (id: string, groupReplyMode: TelegramGroupReplyMode) =>
      update.mutate({ id, groupReplyMode }),
    remove: (id: string) => remove.mutate(id),
    cancel: () => setPending(null),
  };
}
