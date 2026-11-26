"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { workspaceKeys } from "../constants/query-keys";
import { assistantConversationService } from "../services/assistant-conversation.service";
import type { AssistantConversationFilters } from "../types/assistant.types";

/** @returns Danh sách hội thoại Trợ lý AI (Web + Telegram). */
export function useAssistantConversations(
  filters: AssistantConversationFilters,
  options: { enabled?: boolean } = {},
) {
  return useListQuery(
    workspaceKeys.conversations.list(filters),
    (signal) => assistantConversationService.list(filters, signal),
    options,
  );
}
