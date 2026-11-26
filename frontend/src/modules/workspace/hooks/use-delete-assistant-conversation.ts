"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { assistantConversationService } from "../services/assistant-conversation.service";

/** @returns Mutation xóa mềm một hội thoại Trợ lý AI. */
export function useDeleteAssistantConversation() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => assistantConversationService.delete(id),
    invalidate: [workspaceKeys.conversations.all],
    success: "deleted",
  });
}
