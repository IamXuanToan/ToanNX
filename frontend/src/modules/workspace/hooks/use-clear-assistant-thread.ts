"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { assistantConfigService } from "../services/assistant-config.service";
import type { AssistantThreadClearResult } from "../types/assistant.types";

/** @returns Mutation xóa sạch lịch sử luồng chat Web duy nhất. */
export function useClearAssistantThread() {
  return useResourceMutation<void, AssistantThreadClearResult>({
    mutationFn: () => assistantConfigService.clearThread(),
    invalidate: [workspaceKeys.all],
    success: false,
  });
}
