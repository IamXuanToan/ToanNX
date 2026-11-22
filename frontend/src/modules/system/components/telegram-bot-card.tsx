"use client";

import { Bot, KeyRound, Plug, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { PasswordInput } from "@/shares/components/common/password-input";
import { StatusBadge } from "@/shares/components/common/status-badge";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { useTelegramBotCard } from "./hooks/use-telegram-bot-card";

const STEPS = ["1", "2", "3"] as const;

/**
 * Bot Telegram riêng: hướng dẫn tạo ở @BotFather, dán token (chỉ ghi, mã hóa), kiểm tra, đổi, xóa.
 *
 * @param props - Quyền thao tác.
 * @returns Khối bot.
 */
export function TelegramBotCard({
  canWrite,
  canDelete,
}: {
  canWrite: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("system.notifications.telegramBot");
  const tCommon = useTranslations("common.actions");
  const state = useTelegramBotCard();
  if (state.bot.isPending) return <Skeleton className="h-28 w-full rounded-xl" />;
  const bot = state.bot.data;
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-medium">
          <Bot className="size-4" aria-hidden />
          {t("title")}
        </p>
        {bot ? (
          <StatusBadge tone={bot.lastErrorCode ? "warning" : "success"}>
            @{bot.username} · …{bot.tokenLast4}
          </StatusBadge>
        ) : null}
      </div>
      {bot?.lastErrorCode ? (
        <p className="text-warning text-sm">{t(`errors.${bot.lastErrorCode}` as never)}</p>
      ) : null}
      {state.editing && canWrite ? (
        <>
          {!bot ? (
            <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
              {STEPS.map((step) => (
                <li key={step}>{t(`steps.${step}`)}</li>
              ))}
            </ol>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <PasswordInput
              value={state.token}
              onChange={(event) => state.setToken(event.target.value)}
              autoComplete="off"
              placeholder={t("placeholder")}
            />
            <Button
              type="button"
              onClick={() => void state.save()}
              disabled={!state.token.trim() || state.isSaving}
            >
              <KeyRound />
              {t("save")}
            </Button>
            {bot ? (
              <Button type="button" variant="outline" onClick={state.cancelEdit}>
                {tCommon("cancel")}
              </Button>
            ) : null}
          </div>
        </>
      ) : bot ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void state.check()}>
            <Plug />
            {t("check")}
          </Button>
          {canWrite ? (
            <Button type="button" variant="outline" size="sm" onClick={state.startEdit}>
              <KeyRound />
              {t("change")}
            </Button>
          ) : null}
          {canDelete ? (
            <Button type="button" variant="outline" size="sm" onClick={state.remove}>
              <Trash2 />
              {t("remove")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
