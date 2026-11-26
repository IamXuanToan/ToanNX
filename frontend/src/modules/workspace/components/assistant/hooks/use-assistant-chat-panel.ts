"use client";

import { useState } from "react";

import { useAssistantChat } from "../../../hooks/use-assistant-chat";
import { useAssistantConversation } from "../../../hooks/use-assistant-conversation";
import { useAssistantConversations } from "../../../hooks/use-assistant-conversations";
import { useDeleteAssistantConversation } from "../../../hooks/use-delete-assistant-conversation";
import { assistantConversationService } from "../../../services/assistant-conversation.service";
import type { AssistantMessage } from "../../../types/assistant.types";

/** @returns State toàn bộ giao diện chat Trợ lý AI: danh sách hội thoại, tin nhắn & tải thêm tin cũ. */
export function useAssistantChatPanel(canManageConversations: boolean) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [extraOldMessages, setExtraOldMessages] = useState<AssistantMessage[]>([]);
  const [olderPage, setOlderPage] = useState(2);
  const [exhaustedOlder, setExhaustedOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [optimisticUserMessages, setOptimisticUserMessages] = useState<AssistantMessage[]>([]);

  const conversations = useAssistantConversations(
    { pageSize: 30, ordering: "-last_message_at" },
    { enabled: canManageConversations },
  );
  const detail = useAssistantConversation(
    activeId ?? undefined,
    Boolean(activeId) && canManageConversations,
  );
  const chat = useAssistantChat();
  const deleteConversation = useDeleteAssistantConversation();

  const selectConversation = (nextId: string | null) => {
    setActiveId(nextId);
    setExtraOldMessages([]);
    setOlderPage(2);
    setExhaustedOlder(false);
    setOptimisticUserMessages([]);
  };

  const recent = detail.data?.recentMessages ?? [];
  const mergedMap = new Map<string, AssistantMessage>();
  for (const msg of [...extraOldMessages, ...recent, ...optimisticUserMessages]) {
    mergedMap.set(msg.id, msg);
  }
  const messages = [...mergedMap.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const hasMoreOlder = Boolean(activeId && detail.data?.hasMoreMessages && !exhaustedOlder);

  const sendMessage = async (rawText?: string) => {
    const text = (rawText ?? draft).trim();
    if (!text || chat.isPending) return;
    if (!rawText) setDraft("");

    if (text === "/newchat") {
      selectConversation(null);
    }

    const res = await chat.mutateAsync({
      message: text,
      conversationId: text === "/newchat" ? null : activeId,
    });
    if (res.conversationId !== activeId) {
      selectConversation(res.conversationId);
    }
    setOptimisticUserMessages((prev) => [...prev, res.message]);
    await conversations.refetch();
    if (res.conversationId) {
      await detail.refetch();
    }
  };

  const loadMore = async () => {
    if (!activeId || loadingOlder || !hasMoreOlder) return;
    setLoadingOlder(true);
    try {
      const pageData = await assistantConversationService.messages(activeId, {
        page: olderPage,
        pageSize: 50,
      });
      setExtraOldMessages((prev) => [...pageData.items, ...prev]);
      if (olderPage >= pageData.pagination.totalPages) {
        setExhaustedOlder(true);
      } else {
        setOlderPage((p) => p + 1);
      }
    } finally {
      setLoadingOlder(false);
    }
  };

  return {
    conversations,
    detail,
    activeId,
    setActiveId: selectConversation,
    messages,
    draft,
    setDraft,
    isSending: chat.isPending,
    hasMoreOlder,
    loadingOlder,
    sendMessage,
    loadMore,
    startNew: () => {
      selectConversation(null);
      setDraft("");
    },
    removeConversation: async (id: string) => {
      await deleteConversation.mutateAsync(id);
      if (activeId === id) {
        selectConversation(null);
      }
    },
  };
}
