"use client";

import { Bot, MessageSquarePlus, Send, Sparkles, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { StatusBadge } from "@/shares/components/common/status-badge";
import { Form } from "@/shares/components/common/form";
import { Button } from "@/shares/components/ui/button";
import { Card } from "@/shares/components/ui/card";
import { Input } from "@/shares/components/ui/input";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { cn } from "cn";

import { ASSISTANT_SLASH_COMMANDS } from "../../constants/defaults";
import { useAssistantChatPanel } from "./hooks/use-assistant-chat-panel";

/**
 * Giao diện Trợ lý AI hai cột (lịch sử hội thoại Web + Telegram bên trái,
 * luồng tin nhắn + badge model/fallback/tokens + 8 nút slash command bên phải).
 *
 * @param props - Quyền chat, quyền xem/xóa lịch sử hội thoại.
 * @returns Màn hình Trợ lý AI.
 */
export function AssistantChat({
  canChat,
  canReadConversations,
  canDeleteConversations,
}: {
  canChat: boolean;
  canReadConversations: boolean;
  canDeleteConversations: boolean;
}) {
  const t = useTranslations("workspace.assistant");
  const format = useFormatter();
  const state = useAssistantChatPanel(canReadConversations);
  const convList = state.conversations.data?.items ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="flex flex-col gap-3 p-3">
        <Button type="button" size="sm" onClick={state.startNew} className="w-full justify-start">
          <MessageSquarePlus />
          {t("newChat")}
        </Button>

        <div className="space-y-1 overflow-y-auto lg:max-h-[65svh]">
          {state.conversations.isPending ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : convList.length === 0 ? (
            <p className="text-muted-foreground px-2 py-4 text-center text-xs">
              {t("emptyConversations")}
            </p>
          ) : (
            convList.map((conv) => {
              const selected = state.activeId === conv.id;
              return (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center justify-between gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors",
                    selected ? "bg-primary-light text-primary font-medium" : "hover:bg-muted/60",
                  )}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => state.setActiveId(conv.id)}
                    className="h-auto min-w-0 flex-1 justify-start truncate px-1 py-1 text-left font-normal"
                  >
                    <span className="truncate">{conv.title || t("newChat")}</span>
                  </Button>
                  {canDeleteConversations ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={conv.title}
                      onClick={() => void state.removeConversation(conv.id)}
                      className="text-muted-foreground hover:text-destructive size-7 shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Card className="flex min-h-[65svh] flex-col justify-between gap-4 p-4">
        <div className="space-y-3 overflow-y-auto pr-1 lg:max-h-[55svh]">
          {state.hasMoreOlder ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={state.loadingOlder}
                onClick={() => void state.loadMore()}
              >
                {t("loadMore")}
              </Button>
            </div>
          ) : null}

          {state.detail.isPending && state.activeId ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : state.messages.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-16 text-center text-sm">
              <Sparkles className="text-primary size-8" aria-hidden />
              <p className="max-w-md">{t("emptyMessages")}</p>
            </div>
          ) : (
            state.messages.map((msg) => {
              const isUser = msg.role === "USER";
              return (
                <div
                  key={msg.id}
                  className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm break-words whitespace-pre-wrap",
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : msg.isError
                          ? "bg-destructive/10 text-destructive border"
                          : "bg-muted/60 border",
                    )}
                  >
                    {msg.content}
                  </div>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 px-1 text-[11px]">
                    {!isUser ? <Bot className="size-3" aria-hidden /> : null}
                    {msg.modelUsed ? (
                      <StatusBadge tone="info">
                        {t("modelBadge", { model: msg.modelUsed })}
                      </StatusBadge>
                    ) : null}
                    {msg.tokensUsed > 0 ? (
                      <span>{t("tokensUsed", { tokens: msg.tokensUsed })}</span>
                    ) : null}
                    {msg.containsPrivateData ? (
                      <StatusBadge tone="warning">{t("privateBadge")}</StatusBadge>
                    ) : null}
                    <span>{format.dateTime(new Date(msg.createdAt), { timeStyle: "short" })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-3 border-t pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">{t("slashLabel")}</span>
            {ASSISTANT_SLASH_COMMANDS.map((item) => (
              <Button
                key={item.key}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                disabled={!canChat || state.isSending}
                onClick={() => {
                  if (item.command.endsWith(" ")) {
                    state.setDraft(item.command);
                  } else {
                    void state.sendMessage(item.command);
                  }
                }}
              >
                {t(`slashCommands.${item.key}`)}
              </Button>
            ))}
          </div>

          <Form
            onSubmit={(e) => {
              e.preventDefault();
              void state.sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={state.draft}
              onChange={(e) => state.setDraft(e.target.value)}
              placeholder={t("placeholder")}
              disabled={!canChat || state.isSending}
              className="h-10 flex-1"
            />
            <Button type="submit" disabled={!canChat || !state.draft.trim() || state.isSending}>
              <Send />
              {state.isSending ? t("sending") : t("send")}
            </Button>
          </Form>
        </div>
      </Card>
    </div>
  );
}
