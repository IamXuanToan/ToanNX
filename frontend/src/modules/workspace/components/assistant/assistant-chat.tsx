"use client";

import { RotateCcw, Send, Sparkles, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { ConfirmDialog } from "@/shares/components/common/confirm-dialog";
import { Form } from "@/shares/components/common/form";
import { MarkdownContent } from "@/shares/components/common/markdown-content";
import { Message } from "@/shares/components/common/message";
import { MessageAvatar } from "@/shares/components/common/message-avatar";
import { MessageContent } from "@/shares/components/common/message-content";
import { MessageMeta } from "@/shares/components/common/message-meta";
import { MessageScroller } from "@/shares/components/common/message-scroller";
import { TimestampText } from "@/shares/components/common/timestamp-text";
import { UserAvatar } from "@/shares/components/common/user-avatar";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Textarea } from "@/shares/components/ui/textarea";
import { cn } from "cn";

import { matchSlashBadgeInMessage } from "../../constants/defaults";
import { AssistantAvatar } from "./assistant-avatar";
import { AssistantCommandBadge } from "./assistant-command-badge";
import { AssistantQuickReplies } from "./assistant-quick-replies";
import { AssistantResultCard } from "./assistant-result-card";
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
  isCustomSize = false,
  onResetSize,
  onClose,
}: {
  variant?: "popup" | "page";
  canChat: boolean;
  enabled?: boolean;
  isCustomSize?: boolean;
  onResetSize?: () => void;
  onClose?: () => void;
}) {
  const t = useTranslations("workspace.assistant");
  const tTable = useTranslations("common.table");
  const state = useAssistantChatPanel(canChat, enabled);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const assistantTitle = state.botProfile?.name || t("defaultName");
  const isPopup = variant === "popup";
  const footerCommands = state.commands.filter((cmd) => cmd.key !== "clear");
  const visibleCommands = isPopup ? footerCommands.slice(0, 4) : footerCommands;
  const scrollWatchKey = `${state.messages.length}:${state.isSending ? "1" : "0"}`;
  const canClear = state.messages.length > 0 && canChat;

  return (
    <>
      {isPopup ? (
        <header className="border-border/60 bg-muted/25 flex shrink-0 items-center justify-between gap-2 border-b px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <AssistantAvatar
              avatarUrl={state.botProfile?.avatar?.url ?? null}
              name={assistantTitle}
              size="default"
              className="size-9 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm font-bold">{assistantTitle}</p>
              <p className="text-muted-foreground truncate text-[11px]">{t("readySubtitle")}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {isCustomSize && onResetSize ? (
              <AppTooltip content={t("resetPopupSize")}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("resetPopupSize")}
                  onClick={onResetSize}
                  data-testid="assistant-reset-size-btn"
                  className="text-muted-foreground hover:bg-muted hover:text-foreground size-8 shrink-0 rounded-lg"
                >
                  <RotateCcw className="size-4" />
                </Button>
              </AppTooltip>
            ) : null}

            {canClear ? (
              <AppTooltip content={t("clearThreadShort")}>
                <span className="inline-flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("clearThreadShort")}
                    onClick={() => state.setClearConfirmOpen(true)}
                    disabled={state.isClearing || state.isSending}
                    data-testid="assistant-clear-thread-btn"
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-8 shrink-0 rounded-lg"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </span>
              </AppTooltip>
            ) : null}

            {onClose ? (
              <AppTooltip content={t("closePopup")}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("closePopup")}
                  onClick={onClose}
                  data-testid="assistant-popup-close"
                  className="size-8 shrink-0 rounded-lg"
                >
                  <X className="size-4" />
                </Button>
              </AppTooltip>
            ) : null}
          </div>
        </header>
      ) : null}

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col justify-between",
          isPopup ? "p-3" : "bg-card rounded-2xl border p-4 shadow-2xs",
        )}
      >
        {!isPopup && canClear ? (
          <div className="border-border/60 mb-2 flex shrink-0 items-center justify-between gap-2 border-b pb-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <AssistantAvatar
                avatarUrl={state.botProfile?.avatar?.url ?? null}
                name={assistantTitle}
                size="sm"
                className="size-7 shrink-0"
              />
              <span className="text-foreground truncate text-sm font-semibold">
                {assistantTitle}
              </span>
            </div>
            <AppTooltip content={t("clearThread")}>
              <span className="inline-flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => state.setClearConfirmOpen(true)}
                  disabled={state.isClearing || state.isSending}
                  data-testid="assistant-clear-thread-btn"
                  className="text-muted-foreground hover:text-destructive h-8 gap-1.5 rounded-lg px-2.5 text-xs"
                >
                  <Trash2 className="size-3.5" />
                  <span>{t("clearThreadShort")}</span>
                </Button>
              </span>
            </AppTooltip>
          </div>
        ) : null}
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
                      <TimestampText value={msg.createdAt} />
                    </MessageMeta>
                  }
                >
                  <MessageContent
                    role={role}
                    isError={msg.isError}
                    className={
                      role === "assistant" && !msg.isError ? "whitespace-normal" : undefined
                    }
                  >
                    {slashBadge ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AssistantCommandBadge
                          commandKey={slashBadge.key}
                          label={t(`slashBadges.${slashBadge.key}`)}
                          className="h-5 px-2 text-[11px]"
                        />
                        {slashBadge.rest ? <span>{slashBadge.rest}</span> : null}
                      </div>
                    ) : role === "assistant" && !msg.isError ? (
                      <MarkdownContent content={msg.content} />
                    ) : (
                      msg.content
                    )}
                    {role === "assistant" && msg.cards?.length ? (
                      <div className="mt-2 space-y-2">
                        {msg.cards.map((card) => (
                          <AssistantResultCard key={`${card.type}-${card.id}`} card={card} />
                        ))}
                      </div>
                    ) : null}
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
          <AssistantQuickReplies
            replies={state.quickReplies}
            input={state.quickInput}
            disabled={!canChat || state.isSending}
            label={t("quickRepliesLabel")}
            onSelect={(text, options) => void state.sendMessage(text, options)}
          />
          <AssistantSlashSuggestions
            suggestions={state.slashSuggestions}
            activeIndex={state.activeSuggestionIndex}
            onHoverIndex={state.setActiveSuggestionIndex}
            onSelect={(item) => {
              if (state.selectSlashCommand(item)) inputRef.current?.focus();
            }}
          />

          <div className="flex flex-wrap items-center gap-1.5">
            {visibleCommands.map((cmd) => (
              <AppTooltip key={cmd.key} content={cmd.command.trim()}>
                <span className="inline-flex">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
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
                </span>
              </AppTooltip>
            ))}
          </div>

          <Form
            onSubmit={(event) => {
              event.preventDefault();
              void state.sendMessage();
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              ref={inputRef}
              rows={1}
              value={state.draft}
              onChange={(event) => state.setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (state.onInputKeyDown(event)) inputRef.current?.focus();
              }}
              placeholder={t("placeholder")}
              disabled={!canChat || state.isSending}
              aria-autocomplete="list"
              aria-expanded={state.slashSuggestions.length > 0}
              className={cn(
                "field-sizing-content max-h-28 min-h-9 resize-none rounded-2xl py-2",
                isPopup ? "text-sm" : "min-h-10",
              )}
              maxLength={2000}
            />
            <Button
              type="submit"
              size={isPopup ? "sm" : "default"}
              disabled={!canChat || !state.draft.trim() || state.isSending}
              aria-label={t("send")}
              className={cn("shrink-0", isPopup ? "h-9 px-3" : "h-10")}
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
