"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { assistantConversationService } from "../services/assistant-conversation.service";

/** @returns Chi tiết một hội thoại Trợ lý AI kèm 50 tin nhắn gần nhất. */
export function useAssistantConversation(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.conversations.detail(id ?? ""),
    queryFn: ({ signal }) => assistantConversationService.get(id ?? "", signal),
    enabled: Boolean(id) && enabled,
  });
}
