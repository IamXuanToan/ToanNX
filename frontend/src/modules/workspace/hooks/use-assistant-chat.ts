"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { assistantService } from "../services/assistant.service";
import type { AssistantChatInput, AssistantChatResult } from "../types/assistant.types";

/** @returns Mutation gửi tin nhắn / slash command tới Trợ lý AI. */
export function useAssistantChat() {
  return useResourceMutation<AssistantChatInput, AssistantChatResult>({
    mutationFn: (input) => assistantService.chat(input),
    invalidate: [workspaceKeys.all],
    success: false,
  });
}
