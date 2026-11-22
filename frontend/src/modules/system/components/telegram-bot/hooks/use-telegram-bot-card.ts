"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { useCheckTelegramBot } from "../../../hooks/use-check-telegram-bot";
import { useDeleteTelegramBot } from "../../../hooks/use-delete-telegram-bot";
import { useSaveTelegramBot } from "../../../hooks/use-save-telegram-bot";
import { useTelegramBot } from "../../../hooks/use-telegram-bot";

/** @returns Bot của mình, token đang nhập, lưu/kiểm tra/xóa. */
export function useTelegramBotCard() {
  const t = useTranslations("system.notifications.telegramBot");
  const bot = useTelegramBot();
  const save = useSaveTelegramBot();
  const check = useCheckTelegramBot();
  const remove = useDeleteTelegramBot();
  const [token, setToken] = useState("");
  const [editing, setEditing] = useState(false);
  return {
    bot,
    token,
    setToken,
    editing: editing || !bot.data,
    startEdit: () => setEditing(true),
    cancelEdit: () => setEditing(false),
    save: async () => {
      await save.mutateAsync(token);
      setToken("");
      setEditing(false);
    },
    check: async () => {
      const result = await check.mutateAsync();
      if (result.hasWebhook) toast.warning(t("hasWebhook"));
      else toast.success(t("checkOk"));
    },
    remove: () => remove.mutate(),
    isSaving: save.isPending,
  };
}
