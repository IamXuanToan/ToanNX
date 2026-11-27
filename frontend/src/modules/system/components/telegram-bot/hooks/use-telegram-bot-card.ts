"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { useCheckTelegramBot } from "../../../hooks/use-check-telegram-bot";
import { useTelegramBot } from "../../../hooks/use-telegram-bot";
import type { TelegramBotCheck } from "../../../types/notification.types";

/** @returns Metadata Bot Telegram chung của hệ thống và thao tác kiểm tra webhook cho quản trị viên. */
export function useTelegramBotCard() {
  const t = useTranslations("system.notifications.telegramBot");
  const bot = useTelegramBot();
  const check = useCheckTelegramBot();
  const [checkResult, setCheckResult] = useState<TelegramBotCheck | null>(null);

  return {
    bot,
    checkResult,
    isChecking: check.isPending,
    check: async () => {
      const result = await check.mutateAsync();
      setCheckResult(result);
      if (result.webhookActive) {
        toast.success(t("checkOk"));
      } else {
        toast.warning(t("webhookInactive"));
      }
    },
  };
}
