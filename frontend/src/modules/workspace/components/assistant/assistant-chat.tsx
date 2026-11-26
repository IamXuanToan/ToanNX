"use client";

import { Send, Sparkles, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRef } from "react";

import { ConfirmDialog } from "@/shares/components/common/confirm-dialog";
import { Form } from "@/shares/components/common/form";
import { Message } from "@/shares/components/common/message";
import { MessageAvatar } from "@/shares/components/common/message-avatar";
import { MessageContent } from "@/shares/components/common/message-content";
import { MessageMeta } from "@/shares/components/common/message-meta";
import { MessageScroller } from "@/shares/components/common/message-scroller";
import { UserAvatar } from "@/shares/components/common/user-avatar";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { cn } from "cn";

import { matchSlashBadgeInMessage } from "../../constants/defaults";
import { AssistantAvatar } from "./assistant-avatar";
import { AssistantCommandBadge } from "./assistant-command-badge";
import { AssistantSlashSuggestions } from "./assistant-slash-suggestions";
import { AssistantThinkingIndicator } from "./assistant-thinking-indicator";
import { useAssistantChatPanel } from "./hooks/use-assistant-chat-panel";

/**
 * Luồng chat 1 cửa chuẩn shadcn (`Message`, `MessageAvatar`, `MessageContent`, `MessageMeta`, `MessageScroller`):
 * chuẩn hóa lệnh nhanh tiếng Việt/Anh và hiện popup gợi ý ngay khi gõ `/`.
 *
 * @param props - Kiểu hiển thị (`popup` hoặc `page`) và quyền trò chuyện.
 * @returns Khung chat Trợ lý AI.
 */
export function AssistantChat({
  variant = "popup",
  canChat,
  enabled = true,
}: {
  variant?: "popup" | "page";
  canChat: boolean;
  enabled?: boolean;
}) {
  const t = useTranslations("workspace.assistant");
  const tTable = useTranslations("common.table");
  const format = useFormatter();
  const state = useAssistantChatPanel(canChat, enabled);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const assistantTitle = state.botProfile?.name || t("defaultName");
  const isPopup = variant === "popup";
  const visibleCommands = isPopup ? state.commands.slice(0, 4) : state.commands;
  const scrollWatchKey = `${state.messages.length}:${state.isSending ? "1" : "0"}`;

  return (
    <>
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col justify-between",
          isPopup ? "p-3" : "bg-card rounded-2xl border p-4 shadow-2xs",
        )}
      >
        <MessageScroller
          watchValue={scrollWatchKey}
          scrollToBottomLabel={t("scrollToBottom")}
          className={cn("space-y-3 pr-1", isPopup ? "py-1" : "max-h-[55svh] py-2")}
        >
          {state.hasMoreOlder ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void state.loadMore()}
                disabled={state.loadingOlder}
              >
                {t("loadMore")}
              </Button>
            </div>
          ) : null}

          {state.threadQuery.isPending ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-12 w-3/4 rounded-2xl" />
              <Skeleton className="ml-auto h-10 w-2/3 rounded-2xl" />
            </div>
          ) : state.messages.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-10 text-center text-sm">
              <Sparkles className="text-primary size-6" aria-hidden />
              <p className="max-w-xs">{t("emptyMessages")}</p>
            </div>
          ) : (
            state.messages.map((msg) => {
              const role = msg.role === "USER" ? "user" : "assistant";
              const slashBadge = role === "user" ? matchSlashBadgeInMessage(msg.content) : null;
              return (
                <Message
                  key={msg.id}
                  role={role}
                  avatar={
                    <MessageAvatar>
                      {role === "user" ? (
                        <UserAvatar
                          user={state.currentUser}
                          alt={msg.senderName || "U"}
                          size="sm"
                          className="size-7"
                        />
                      ) : (
                        <AssistantAvatar
                          avatarUrl={state.botProfile?.avatar?.url ?? null}
                          name={assistantTitle}
                          size="sm"
                          className="size-7"
                        />
                      )}
                    </MessageAvatar>
                  }
                  meta={
                    <MessageMeta align={role === "user" ? "end" : "start"}>
                      <span>
                        {format.dateTime(new Date(msg.createdAt), { timeStyle: "short" })}
                      </span>
                    </MessageMeta>
                  }
                >
                  <MessageContent role={role} isError={msg.isError}>
                    {slashBadge ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AssistantCommandBadge
                          commandKey={slashBadge.key}
                          label={t(`slashBadges.${slashBadge.key}`)}
                          className="h-5 px-2 text-[11px]"
                        />
                        {slashBadge.rest ? <span>{slashBadge.rest}</span> : null}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </MessageContent>
                </Message>
              );
            })
          )}

          {state.isSending ? (
            <AssistantThinkingIndicator
              name={assistantTitle}
              avatarUrl={state.botProfile?.avatar?.url ?? null}
              label={t("thinking", { name: assistantTitle })}
            />
          ) : null}
        </MessageScroller>

        <div className="border-border/60 relative mt-2 space-y-2 border-t pt-2.5">
          <AssistantSlashSuggestions
            suggestions={state.slashSuggestions}
            activeIndex={state.activeSuggestionIndex}
            onHoverIndex={state.setActiveSuggestionIndex}
            onSelect={(item) => {
              if (state.selectSlashCommand(item)) inputRef.current?.focus();
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleCommands.map((cmd) => (
                <Button
                  key={cmd.key}
                  type="button"
                  size="sm"
                  variant="ghost"
                  title={cmd.command.trim()}
                  disabled={!canChat || state.isSending}
                  onClick={() => {
                    if (state.selectSlashCommand(cmd)) inputRef.current?.focus();
                  }}
                  className="h-auto rounded-full p-0 hover:bg-transparent"
                >
                  <AssistantCommandBadge
                    commandKey={cmd.key}
                    label={t(`slashBadges.${cmd.key}`)}
                    className="hover:opacity-85"
                  />
                </Button>
              ))}
            </div>

            {state.messages.length > 0 && canChat ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => state.setClearConfirmOpen(true)}
                disabled={state.isClearing || state.isSending}
                data-testid="assistant-clear-thread-btn"
                className="text-muted-foreground hover:text-destructive h-6 gap-1 px-2 text-[11px]"
              >
                <Trash2 className="size-3" />
                <span>{t("clearThreadShort")}</span>
              </Button>
            ) : null}
          </div>

          <Form
            onSubmit={(event) => {
              event.preventDefault();
              void state.sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={state.draft}
              onChange={(event) => state.setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (state.onInputKeyDown(event)) inputRef.current?.focus();
              }}
              placeholder={t("placeholder")}
              disabled={!canChat || state.isSending}
              aria-autocomplete="list"
              aria-expanded={state.slashSuggestions.length > 0}
              className={cn(isPopup ? "h-9 text-sm" : "h-10")}
              maxLength={2000}
            />
            <Button
              type="submit"
              size={isPopup ? "sm" : "default"}
              disabled={!canChat || !state.draft.trim() || state.isSending}
              aria-label={t("send")}
              className={cn(isPopup ? "h-9 px-3" : "h-10")}
            >
              <Send className="size-4" />
              {isPopup ? null : <span>{t("send")}</span>}
            </Button>
          </Form>
        </div>
      </div>

      <ConfirmDialog
        open={state.clearConfirmOpen}
        onOpenChange={state.setClearConfirmOpen}
        title={t("clearThread")}
        description={t("clearConfirm")}
        confirmLabel={tTable("delete")}
        onConfirm={() => void state.confirmClearThread()}
        isPending={state.isClearing}
      />
    </>
  );
}
