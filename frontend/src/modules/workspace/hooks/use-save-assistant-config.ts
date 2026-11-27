"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { assistantConfigService } from "../services/assistant-config.service";
import type { AssistantConfig, AssistantConfigUpdateInput } from "../types/assistant.types";

/** @returns Mutation lưu cấu hình Chatbot AI trên màn Admin. */
export function useSaveAssistantConfig() {
  return useResourceMutation<AssistantConfigUpdateInput, AssistantConfig>({
    mutationFn: (input) => assistantConfigService.update(input),
    invalidate: [workspaceKeys.all],
    toastError: false,
  });
}
