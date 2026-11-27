"use client";

import { Bot, ExternalLink, Plug } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/shares/components/common/status-badge";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";

import { useTelegramBotCard } from "./hooks/use-telegram-bot-card";

/**
 * Thẻ hiển thị Bot Telegram dùng chung của hệ thống (`TELEGRAM_BOT_TOKEN` từ ENV server).
 * Cho phép thành viên mở chat với bot; quản trị có quyền `system.setting.update` có thể kiểm tra webhook.
 *
 * @param props - Quyền kiểm tra/đồng bộ webhook.
 * @returns Khối thông tin Bot Telegram hệ thống.
 */
export function TelegramBotCard({ canCheck }: { canCheck: boolean }) {
  const t = useTranslations("system.notifications.telegramBot");
  const state = useTelegramBotCard();

  if (state.bot.isPending) return <Skeleton className="h-24 w-full rounded-xl" />;

  const bot = state.bot.data;
  const checkResult = state.checkResult;
  const safeBotUrl = toSafeHttpUrl(bot?.botUrl, { allowRelative: false });
  const errorCode = checkResult?.lastErrorCode ?? "";

  return (
    <section className="space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <Bot className="size-4 shrink-0" aria-hidden />
          <span>{t("title")}</span>
        </div>
        {bot?.configured ? (
          <StatusBadge tone="success">
            {bot.displayName ? `${bot.displayName} · ` : ""}@{bot.username}
          </StatusBadge>
        ) : (
          <StatusBadge tone="warning">{t("unconfiguredBadge")}</StatusBadge>
        )}
      </div>

      <p className="text-muted-foreground text-sm">
        {bot?.configured ? t("configuredDescription") : t("unconfigured")}
      </p>

      {checkResult ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <StatusBadge tone={checkResult.webhookActive ? "success" : "warning"}>
            {checkResult.webhookActive ? t("webhookActive") : t("webhookInactive")}
          </StatusBadge>
          {checkResult.webhookUrl ? (
            <span className="text-muted-foreground truncate">{checkResult.webhookUrl}</span>
          ) : null}
        </div>
      ) : null}

      {errorCode ? (
        <p className="text-warning text-sm">{t(`errors.${errorCode}` as never)}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {safeBotUrl ? (
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link href={safeBotUrl as never} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              {t("openBot")}
            </Link>
          </Button>
        ) : null}
        {canCheck && bot?.configured ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            disabled={state.isChecking}
            onClick={() => void state.check()}
          >
            <Plug />
            {t("checkWebhook")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
