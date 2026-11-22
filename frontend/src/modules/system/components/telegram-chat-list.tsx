"use client";

import { ExternalLink, MessageCircle, Send, Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { StatusBadge } from "@/shares/components/common/status-badge";
import { Button } from "@/shares/components/ui/button";

import { useTelegramChatList } from "./hooks/use-telegram-chat-list";

/**
 * Nơi nhận Telegram: đăng ký nhóm (`startgroup`) hoặc chat riêng với bot (`start`) bằng mã 10 phút → Kiểm tra;
 * gửi thử, xóa.
 *
 * @param props - Quyền.
 * @returns Khối nơi nhận.
 */
export function TelegramChatList({
  canCreate,
  canDelete,
}: {
  canCreate: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("system.notifications.telegramChats");
  const tCommon = useTranslations("common.actions");
  const state = useTelegramChatList(true);
  const chats = (state.chats.data ?? []).filter((chat) => chat.status !== "pending");
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <p className="font-medium">{t("title")}</p>
      {chats.length ? (
        <ul className="divide-y">
          {chats.map((chat) => (
            <li key={chat.id} className="flex items-center gap-2 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{chat.title || chat.chatId}</span>
              <StatusBadge tone={chat.status === "active" ? "success" : "warning"}>
                {t(`status.${chat.status}`)}
              </StatusBadge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("test")}
                onClick={() => state.test(chat.id)}
              >
                <Send />
              </Button>
              {canDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("remove")}
                  onClick={() => state.remove(chat.id)}
                >
                  <Trash2 />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}
      {state.pending ? (
        <div className="space-y-2 rounded-lg border border-dashed p-3 text-sm">
          <p>{t("pendingHint", { code: state.pending.code })}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={state.pending.link} target="_blank" rel="noreferrer">
                <ExternalLink />
                {t("openTelegram")}
              </a>
            </Button>
            <Button type="button" size="sm" onClick={() => void state.verify()}>
              {t("verify")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={state.cancel}>
              {tCommon("cancel")}
            </Button>
          </div>
        </div>
      ) : canCreate ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void state.start("group")}
          >
            <Users />
            {t("addGroup")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void state.start("private")}
          >
            <MessageCircle />
            {t("addPrivate")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
