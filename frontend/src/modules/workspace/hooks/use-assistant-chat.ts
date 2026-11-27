"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { assistantService } from "../services/assistant.service";
import type { AssistantChatInput, AssistantChatResult } from "../types/assistant.types";

/** @returns Mutation gửi tin nhắn / slash command tới Trợ lý AI. */
export function useAssistantChat() {
  const queryClient = useQueryClient();

  return useResourceMutation<AssistantChatInput, AssistantChatResult>({
    mutationFn: (input) => assistantService.chat(input),
    invalidate: [workspaceKeys.assistantThreadRoot()],
    success: false,
    onSuccess: (result) => {
      if (result.containsPrivateData) {
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: workspaceKeys.reminders.all }),
          queryClient.invalidateQueries({ queryKey: workspaceKeys.dashboardSummaryRoot() }),
          queryClient.invalidateQueries({ queryKey: workspaceKeys.calendarRoot() }),
        ]);
      }
    },
  });
}
