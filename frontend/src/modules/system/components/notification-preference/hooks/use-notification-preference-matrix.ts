"use client";

import { useState } from "react";

import { useNotificationPreferences } from "../../../hooks/use-notification-preferences";
import { useSaveNotificationPreferences } from "../../../hooks/use-save-notification-preferences";
import { useTelegramChats } from "../../../hooks/use-telegram-chats";
import type { NotificationPreferenceInput } from "../../../types/notification.types";

/**
 * State bảng tùy chọn: dữ liệu BE (đã gộp mặc định) + các ô người dùng vừa sửa (chưa lưu); lưu một lần.
 *
 * @param canTelegram - Có quyền xem chat Telegram.
 * @returns Kênh dùng được, nháp, chat, handler.
 */
export function useNotificationPreferenceMatrix(canTelegram: boolean) {
  const preferences = useNotificationPreferences();
  const chats = useTelegramChats(canTelegram);
  const save = useSaveNotificationPreferences();
  const [edits, setEdits] = useState<Record<string, Partial<NotificationPreferenceInput>>>({});
  const draft: NotificationPreferenceInput[] = (preferences.data?.items ?? []).map((item) => ({
    eventCode: item.event.code,
    inApp: item.inApp,
    push: item.push,
    email: item.email,
    telegramChatIds: item.telegramChatIds,
    ...edits[item.event.code],
  }));
  const activeChatIds = (chats.data ?? [])
    .filter((chat) => chat.status === "active" && chat.isActive)
    .map((chat) => chat.id);
  const update = (code: string, patch: Partial<NotificationPreferenceInput>) =>
    setEdits((current) => ({ ...current, [code]: { ...current[code], ...patch } }));
  return {
    preferences,
    channels: preferences.data?.channels ?? [],
    items: preferences.data?.items ?? [],
    draft,
    /**
     * Trạng thái ô Telegram của một sự kiện: bật khi gửi tới mọi nơi nhận đang hoạt động, "một phần" khi mới chọn
     * vài nơi (dữ liệu cũ), tắt khi không gửi. Danh sách nơi nhận xem ở khối "Nơi nhận Telegram".
     */
    telegramState: (row: NotificationPreferenceInput): boolean | "indeterminate" => {
      const selected = activeChatIds.filter((id) => row.telegramChatIds.includes(id)).length;
      if (selected === 0) return false;
      return selected === activeChatIds.length ? true : "indeterminate";
    },
    hasTelegramChats: activeChatIds.length > 0,
    update,
    /** Bật = gửi tới mọi nơi nhận Telegram đang hoạt động; tắt = không gửi Telegram cho sự kiện này. */
    toggleTelegram: (code: string, checked: boolean) =>
      update(code, { telegramChatIds: checked ? activeChatIds : [] }),
    save: () => save.mutate(draft, { onSuccess: () => setEdits({}) }),
    isSaving: save.isPending,
  };
}
