"use client";

import type { KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { formatUserDisplayName } from "@/shares/lib/user-display";

import {
  isClearSlashCommand,
  resolveLocaleSlashCommands,
  type ResolvedAssistantSlashCommand,
} from "../../../constants/defaults";
import { useAssistantBotProfile } from "../../../hooks/use-assistant-bot-profile";
import { useAssistantChat } from "../../../hooks/use-assistant-chat";
import { useAssistantThread } from "../../../hooks/use-assistant-thread";
import { useClearAssistantThread } from "../../../hooks/use-clear-assistant-thread";
import { assistantConfigService } from "../../../services/assistant-config.service";
import type { AssistantMessage } from "../../../types/assistant.types";

/**
 * State cho giao diện 1 luồng chat Web duy nhất của Trợ lý AI:
 * đọc/phân trang tin nhắn cũ, gợi ý lệnh nhanh khi gõ `/`, gửi câu hỏi và làm mới luồng.
 *
 * @param canChat - Quyền `workspace.assistant.chat`.
 * @param enabled - Bật query tải lịch sử tin nhắn (vd: khi popup đang mở).
 * @returns Danh sách tin nhắn, danh sách gợi ý `/` theo ngôn ngữ, thông tin Bot & handlers thao tác.
 */
export function useAssistantChatPanel(canChat: boolean, enabled = true) {
  const t = useTranslations("workspace.assistant");
  const locale = useLocale();
  const [draft, setDraftState] = useState("");
  const [slashDismissed, setSlashDismissed] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [olderMessages, setOlderMessages] = useState<AssistantMessage[]>([]);
  const [nextPage, setNextPage] = useState(2);
  const [exhaustedOlder, setExhaustedOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [pendingUserMsg, setPendingUserMsg] = useState<AssistantMessage | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const currentUser = useCurrentUser();
  const profileQuery = useAssistantBotProfile(canChat);
  const threadQuery = useAssistantThread(canChat && enabled);
  const chatMutation = useAssistantChat();
  const clearMutation = useClearAssistantThread();

  const commands = useMemo(() => resolveLocaleSlashCommands(locale), [locale]);

  const slashSuggestions = useMemo(() => {
    if (!canChat || slashDismissed || !draft.startsWith("/") || /\s/.test(draft)) {
      return [];
    }
    const query = draft.slice(1).toLowerCase();
    if (!query) return commands;
    return commands.filter((cmd) => {
      const desc = t(`slashCommands.${cmd.key}`).toLowerCase();
      return (
        cmd.command.trim().slice(1).toLowerCase().includes(query) ||
        cmd.alias.slice(1).toLowerCase().includes(query) ||
        desc.includes(query)
      );
    });
  }, [canChat, commands, draft, slashDismissed, t]);

  const safeSuggestionIndex =
    slashSuggestions.length === 0
      ? 0
      : Math.min(Math.max(activeSuggestionIndex, 0), slashSuggestions.length - 1);

  const recentMessages = threadQuery.data?.messages ?? [];
  const mergedMap = new Map<string, AssistantMessage>();
  for (const msg of [...olderMessages, ...recentMessages]) {
    if (msg.role === "TOOL" || msg.role === "SYSTEM") continue;
    if (!msg.content?.trim()) continue;
    if (Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0) continue;
    mergedMap.set(msg.id, msg);
  }
  if (pendingUserMsg && !mergedMap.has(pendingUserMsg.id)) {
    mergedMap.set(pendingUserMsg.id, pendingUserMsg);
  }
  const messages = [...mergedMap.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const hasMoreOlder = Boolean(threadQuery.data?.hasMoreMessages && !exhaustedOlder);

  function setDraft(value: string) {
    setDraftState(value);
    setSlashDismissed(false);
    setActiveSuggestionIndex(0);
  }

  async function sendMessage(rawText?: string) {
    const text = (rawText ?? draft).trim();
    if (!text || !canChat || chatMutation.isPending || clearMutation.isPending) return;
    if (!rawText) {
      setDraftState("");
      setSlashDismissed(false);
    }

    if (isClearSlashCommand(text)) {
      await confirmClearThread();
      return;
    }

    setPendingUserMsg({
      id: `pending-user-${Date.now()}`,
      conversationId: "",
      role: "USER",
      senderTelegramId: null,
      senderName: formatUserDisplayName(currentUser.data?.user, { includeUsername: false }),
      content: text,
      toolCalls: [],
      toolCallId: "",
      modelUsed: "",
      tokensUsed: 0,
      containsPrivateData: false,
      isError: false,
      createdAt: new Date().toISOString(),
    });

    try {
      await chatMutation.mutateAsync({ message: text });
      setPendingUserMsg(null);
    } catch {
      setPendingUserMsg(null);
    }
  }

  function selectSlashCommand(
    item: ResolvedAssistantSlashCommand,
    options: { runImmediately?: boolean } = {},
  ): boolean {
    const shouldRun = options.runImmediately ?? !item.insertOnly;
    setSlashDismissed(true);
    setActiveSuggestionIndex(0);
    if (shouldRun) {
      setDraftState("");
      void sendMessage(item.command.trim());
      return false;
    }
    setDraftState(`${item.command.trim()} `);
    return true;
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>): boolean {
    if (slashSuggestions.length === 0) return false;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((safeSuggestionIndex + 1) % slashSuggestions.length);
      return false;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex(
        (safeSuggestionIndex - 1 + slashSuggestions.length) % slashSuggestions.length,
      );
      return false;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation?.();
      setSlashDismissed(true);
      return false;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const target = slashSuggestions[safeSuggestionIndex];
      return target ? selectSlashCommand(target, { runImmediately: false }) : false;
    }
    if (event.key === "Enter") {
      const target = slashSuggestions[safeSuggestionIndex];
      if (target) {
        event.preventDefault();
        return selectSlashCommand(target, { runImmediately: !target.insertOnly });
      }
    }
    return false;
  }

  async function loadMore() {
    if (loadingOlder || !hasMoreOlder) return;
    setLoadingOlder(true);
    try {
      const pageData = await assistantConfigService.getThread({ page: nextPage, pageSize: 50 });
      setOlderMessages((prev) => [...pageData.messages, ...prev]);
      if (!pageData.hasMoreMessages) {
        setExhaustedOlder(true);
      } else {
        setNextPage((prev) => prev + 1);
      }
    } finally {
      setLoadingOlder(false);
    }
  }

  async function confirmClearThread() {
    await clearMutation.mutateAsync();
    setOlderMessages([]);
    setNextPage(2);
    setExhaustedOlder(false);
    setPendingUserMsg(null);
    setClearConfirmOpen(false);
    toast.success(t("clearSuccess"));
  }

  return {
    currentUser: currentUser.data?.user ?? null,
    botProfile: profileQuery.data ?? null,
    threadQuery,
    messages,
    commands,
    slashSuggestions,
    activeSuggestionIndex: safeSuggestionIndex,
    setActiveSuggestionIndex,
    selectSlashCommand,
    onInputKeyDown,
    hasMoreOlder,
    loadingOlder,
    loadMore,
    draft,
    setDraft,
    sendMessage,
    isSending: chatMutation.isPending,
    chatError: chatMutation.error,
    clearConfirmOpen,
    setClearConfirmOpen,
    confirmClearThread,
    isClearing: clearMutation.isPending,
  };
}
